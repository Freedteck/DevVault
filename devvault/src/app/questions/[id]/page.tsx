import { notFound } from "next/navigation";
import { getTopicMessage, getTopicMessages } from "@/lib/hedera-mirror";
import { fetchFromIPFS } from "@/lib/ipfs";
import type {
  HCSQuestionPayload,
  HCSAnswerPayload,
  HCSAcceptPayload,
} from "@/lib/hcs-types";
import type { LiveQuestion, LiveAnswer } from "@/lib/live-types";
import { QuestionDetailClient } from "./QuestionDetailClient";
import { Metadata } from "next";

export const revalidate = 10;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sequenceNumber = parseInt(id);
  if (isNaN(sequenceNumber)) return { title: "Question Not Found" };

  const questionsTopicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;
  try {
    const qMessage = await getTopicMessage<HCSQuestionPayload>(
      questionsTopicId,
      sequenceNumber,
    );
    return { title: `${qMessage.data?.title || "Question"} | DevVault` };
  } catch {
    return { title: "DevVault Question" };
  }
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const sequenceNumber = parseInt(id);

  if (isNaN(sequenceNumber)) {
    notFound();
  }

  const questionsTopicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;

  try {
    const qMessage = await getTopicMessage<HCSQuestionPayload>(
      questionsTopicId,
      sequenceNumber,
    );
    if (qMessage.data?.type !== "QUESTION") return notFound();

    // Resolve body: IPFS if bodyCid is set, else inline body from HCS
    const qBodyCid = qMessage.data.bodyCid as string | undefined;
    const questionBody = qBodyCid
      ? (await fetchFromIPFS(qBodyCid)) ?? qMessage.data.body
      : qMessage.data.body;

    const question: LiveQuestion = {
      sequenceNumber: qMessage.sequenceNumber,
      consensusTimestamp: qMessage.consensusTimestamp,
      title: qMessage.data.title,
      shortDescription: qMessage.data.shortDescription,
      body: questionBody,
      tags: qMessage.data.tags || [],
      author: qMessage.data.author,
      bountyAmount: qMessage.data.bountyAmount || 0,
      bountyCurrency: qMessage.data.bountyCurrency || "DVT",
      discussionTopicId: qMessage.data.discussionTopicId,
      accepted: false,
      acceptedAnswerSequence: undefined,
      tipTotal: 0,
    };

    let answers: LiveAnswer[] = [];
    if (question.discussionTopicId) {
      // Gracefully catch errors if the discussion topic has no messages yet
      try {
        // Fetch ALL message types from the discussion topic in one call
        const allMessages = await getTopicMessages<
          HCSAnswerPayload | HCSAcceptPayload
        >(question.discussionTopicId, 100);

        // Find ACCEPT message (there should be at most one)
        const acceptMsg = allMessages.find(
          (msg) => msg.data?.type === "ACCEPT",
        );
        const acceptedSequence = acceptMsg
          ? (acceptMsg.data as HCSAcceptPayload).acceptedMessageSequence
          : undefined;

        // Mark question accepted if an ACCEPT message exists
        if (acceptedSequence !== undefined) {
          question.accepted = true;
          question.acceptedAnswerSequence = acceptedSequence;
        }

        // Build answer list, marking the accepted one, resolving IPFS bodies
        const answerMessages = allMessages.filter(
          (msg) => msg.data?.type === "ANSWER",
        );
        answers = await Promise.all(
          answerMessages.map(async (msg) => {
            const aData = msg.data as HCSAnswerPayload;
            const bodyCid = aData.bodyCid as string | undefined;
            const body = bodyCid
              ? (await fetchFromIPFS(bodyCid)) ?? aData.body
              : aData.body;
            return {
              sequenceNumber: msg.sequenceNumber,
              consensusTimestamp: msg.consensusTimestamp,
              body,
              author: aData.author,
              accepted: msg.sequenceNumber === acceptedSequence,
              tipTotal: 0,
            };
          }),
        );
        answers = answers.reverse();
      } catch (err) {
        console.warn("Could not fetch answers or no answers found yet:", err);
      }
    }

    return <QuestionDetailClient question={question} answers={answers} />;
  } catch (err) {
    console.error("Failed to load question details:", err);
    return notFound();
  }
}
