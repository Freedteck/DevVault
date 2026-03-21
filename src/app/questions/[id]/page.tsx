import { notFound } from "next/navigation";
import { getTopicMessage, getTopicMessages } from "@/lib/hedera-mirror";
import { fetchFromIPFS } from "@/lib/ipfs";
import type {
  HCSQuestionPayload,
  HCSAnswerPayload,
  HCSAIAnswerPayload,
  HCSAICommentPayload,
  HCSAcceptPayload,
  HCSReplyPayload,
} from "@/lib/hcs-types";
import type { LiveQuestion, LiveAnswer, LiveReply } from "@/lib/live-types";
import { QuestionDetailClient } from "./QuestionDetailClient";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour, manually revalidated on activity

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
    return { title: `${qMessage.data?.title || "Question"} | Vurso` };
  } catch {
    return { title: "Vurso Question" };
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
      ? ((await fetchFromIPFS(qBodyCid)) ?? qMessage.data.body)
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
      bountyCurrency: qMessage.data.bountyCurrency || "VRS",
      discussionTopicId: qMessage.data.discussionTopicId,
      accepted: false,
      acceptedAnswerSequence: undefined,
    };

    let answers: LiveAnswer[] = [];
    let repliesMap: Record<number, LiveReply[]> = {};
    let summaryAnswer: LiveAnswer | null = null;
    let autoAnswer: LiveAnswer | null = null;
    if (question.discussionTopicId) {
      // Gracefully catch errors if the discussion topic has no messages yet
      try {
        // Fetch ALL message types from the discussion topic in one call
        const allMessages = await getTopicMessages<
          | HCSAnswerPayload
          | HCSAcceptPayload
          | HCSReplyPayload
          | Record<string, unknown>
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
          (msg) =>
            msg.data?.type === "ANSWER" ||
            msg.data?.type === "AI_ANSWER" ||
            msg.data?.type === "AI_COMMENT",
        );
        answers = await Promise.all(
          answerMessages.map(async (msg) => {
            const isAiAnswer = msg.data?.type === "AI_ANSWER";
            const isAiComment = msg.data?.type === "AI_COMMENT";
            const aData = msg.data as
              | HCSAnswerPayload
              | HCSAIAnswerPayload
              | HCSAICommentPayload;
            const bodyCid = (aData as HCSAnswerPayload).bodyCid as
              | string
              | undefined;
            const body = bodyCid
              ? ((await fetchFromIPFS(bodyCid)) ?? aData.body)
              : aData.body;
            return {
              sequenceNumber: msg.sequenceNumber,
              consensusTimestamp: msg.consensusTimestamp,
              body,
              author: aData.author,
              accepted:
                !isAiAnswer &&
                !isAiComment &&
                msg.sequenceNumber === acceptedSequence,
              isAiAnswer,
              hasBounty: isAiAnswer
                ? !!(aData as HCSAIAnswerPayload).hasBounty
                : undefined,
              isSummary: isAiComment
                ? !!(aData as HCSAICommentPayload).isSummary
                : undefined,
              isSpamFlag: isAiComment
                ? !!(aData as HCSAICommentPayload).isSpamFlag
                : undefined,
              isAgentComment: isAiComment,
            };
          }),
        );
        // Extract summary and isolate answers
        summaryAnswer = answers.find((a) => a.isSummary) || null;
        autoAnswer = answers.find((a) => a.isAiAnswer) || null;

        // Final answers list should ONLY contain human contributions
        answers = answers
          .filter((a) => !a.isAiAnswer && !a.isAgentComment)
          .reverse();

        // Build replies grouped by the answer sequence they target
        const replyMessages = allMessages.filter(
          (msg) => msg.data?.type === "REPLY",
        );
        for (const msg of replyMessages) {
          const rData = msg.data as HCSReplyPayload;
          const key = rData.replyToSequence;
          if (!repliesMap[key]) repliesMap[key] = [];
          repliesMap[key].push({
            sequenceNumber: msg.sequenceNumber,
            consensusTimestamp: msg.consensusTimestamp,
            replyToSequence: key,
            body: rData.body,
            author: rData.author,
            isSpamFlag: !!rData.isSpamFlag,
            isAgentComment: !!rData.isAgentComment,
          });
        }
      } catch (err) {
        console.warn("Could not fetch answers or no answers found yet:", err);
      }
    }

    return (
      <QuestionDetailClient
        question={question}
        answers={answers}
        repliesMap={repliesMap}
        summary={summaryAnswer}
        autoAnswer={autoAnswer}
      />
    );
  } catch (err) {
    console.error("Failed to load question details:", err);
    return notFound();
  }
}
