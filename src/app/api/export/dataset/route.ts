import { NextRequest, NextResponse } from "next/server";
import { getTopicMessages } from "@/lib/hedera-mirror";
import { fetchFromIPFS } from "@/lib/ipfs";
import type {
  HCSQuestionPayload,
  HCSAnswerPayload,
  HCSAcceptPayload,
} from "@/lib/hcs-types";

const QUESTIONS_TOPIC = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;
const DATASET_VERSION = "vurso-verified-dev-qa-v1";

export interface DatasetPair {
  question_id: number;
  question: string;
  question_body: string | null;
  tags: string[];
  accepted_answer: string;
  answer_author: string;
  answer_author_display: string;
  question_author: string;
  question_author_display: string;
  consensus_timestamp: string;
  bounty_amount: number;
  bounty_currency: string;
  discussion_topic_id: string;
  verified: true;
  license: "CC-BY-4.0";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = parseInt(searchParams.get("limit") ?? "50");
  const pageParam = parseInt(searchParams.get("page") ?? "1");
  const tagFilter = searchParams.get("tag")?.toLowerCase() ?? null;

  const limit = Math.min(Math.max(limitParam, 1), 200);
  const page = Math.max(pageParam, 1);

  try {
    // Fetch all questions from the main topic
    const allMessages = await getTopicMessages<HCSQuestionPayload>(
      QUESTIONS_TOPIC,
      500,
    );

    const questionMessages = allMessages.filter(
      (m) => m.data?.type === "QUESTION",
    );

    const pairs: DatasetPair[] = [];

    // For each question, check if it has an accepted answer
    for (const qMsg of questionMessages) {
      const q = qMsg.data as HCSQuestionPayload;
      if (!q.discussionTopicId) continue;

      // Apply tag filter
      if (
        tagFilter &&
        !(q.tags || []).some((t) => t.toLowerCase() === tagFilter)
      )
        continue;

      try {
        const discMessages = await getTopicMessages<
          HCSAnswerPayload | HCSAcceptPayload | Record<string, unknown>
        >(q.discussionTopicId, 100);

        const acceptMsg = discMessages.find(
          (m) => (m.data as HCSAcceptPayload)?.type === "ACCEPT",
        );
        if (!acceptMsg) continue; // skip — no accepted answer yet

        const acceptData = acceptMsg.data as HCSAcceptPayload;
        const acceptedSeq = acceptData.acceptedMessageSequence;
        const answererAccountId = acceptData.answererAccountId;

        // Find the accepted answer message
        const answerMsg = discMessages.find(
          (m) =>
            m.sequenceNumber === acceptedSeq &&
            (m.data as HCSAnswerPayload)?.type === "ANSWER",
        );
        if (!answerMsg) continue;

        const aData = answerMsg.data as HCSAnswerPayload;

        // Resolve full bodies from IPFS if needed
        const [questionBody, answerBody] = await Promise.all([
          q.bodyCid
            ? fetchFromIPFS(q.bodyCid)
            : Promise.resolve(q.body ?? null),
          aData.bodyCid
            ? fetchFromIPFS(aData.bodyCid)
            : Promise.resolve(aData.body ?? null),
        ]);

        if (!answerBody) continue; // no answer body, skip

        pairs.push({
          question_id: qMsg.sequenceNumber,
          question: q.title,
          question_body: questionBody ?? q.shortDescription ?? null,
          tags: q.tags || [],
          accepted_answer: answerBody,
          answer_author: aData.author.accountId,
          answer_author_display: aData.author.displayName,
          question_author: q.author.accountId,
          question_author_display: q.author.displayName,
          consensus_timestamp: qMsg.consensusTimestamp,
          bounty_amount: q.bountyAmount ?? 0,
          bounty_currency: q.bountyCurrency ?? "VRS",
          discussion_topic_id: q.discussionTopicId,
          verified: true,
          license: "CC-BY-4.0",
        });
      } catch {
        // Skip questions whose discussion topics fail
        continue;
      }
    }

    // Pagination
    const total = pairs.length;
    const start = (page - 1) * limit;
    const paginated = pairs.slice(start, start + limit);

    return NextResponse.json(
      {
        dataset: DATASET_VERSION,
        description:
          "Human-verified developer Q&A pairs from Vurso. Every accepted answer is economically staked on Hedera HCS — verified, attributed, and immutable.",
        license: "CC-BY-4.0",
        total_pairs: total,
        page,
        limit,
        has_more: start + limit < total,
        pairs: paginated,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
          "X-Dataset-Version": DATASET_VERSION,
        },
      },
    );
  } catch (err) {
    console.error("Dataset export error:", err);
    return NextResponse.json(
      { error: "Failed to generate dataset" },
      { status: 500 },
    );
  }
}
