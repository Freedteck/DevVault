import { NextRequest, NextResponse } from "next/server";
import { getTopicMessages } from "@/lib/hedera-mirror";
import type { HCSQuestionPayload, HCSUpdatePayload } from "@/lib/hcs-types";

/**
 * GET /api/search?q=...
 *
 * Unified search for Questions and Updates.
 * Fetches recent activity from both topics and filters locally.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const questionsTopicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;
  const updatesTopicId = process.env.NEXT_PUBLIC_UPDATES_TOPIC_ID!;

  try {
    // Fetch recent messages from both channels
    // We fetch a generous amount (100 each) to provide a good "Recent Search" baseline
    const [qMsgs, uMsgs] = await Promise.all([
      getTopicMessages<HCSQuestionPayload>(questionsTopicId, 100).catch(
        () => [],
      ),
      getTopicMessages<HCSUpdatePayload>(updatesTopicId, 100).catch(() => []),
    ]);

    const results: any[] = [];

    // Filter Questions
    qMsgs.forEach((msg) => {
      if (msg.data?.type === "QUESTION") {
        const title = msg.data.title || "";
        const body = msg.data.body || "";
        const tags = (msg.data.tags || []).join(" ");

        if (
          title.toLowerCase().includes(query) ||
          body.toLowerCase().includes(query) ||
          tags.toLowerCase().includes(query)
        ) {
          results.push({
            type: "QUESTION",
            id: msg.sequenceNumber.toString(),
            title: title,
            description: msg.data.shortDescription || body.slice(0, 100),
            timestamp: msg.consensusTimestamp,
            author: msg.data.author.displayName,
          });
        }
      }
    });

    // Filter Updates
    uMsgs.forEach((msg) => {
      if (msg.data?.type === "UPDATE") {
        const title = msg.data.title || "";
        const body = msg.data.body || "";

        if (
          title.toLowerCase().includes(query) ||
          body.toLowerCase().includes(query)
        ) {
          results.push({
            type: "UPDATE",
            id: msg.sequenceNumber.toString(),
            title: title,
            description: msg.data.shortDescription || body.slice(0, 100),
            timestamp: msg.consensusTimestamp,
            author: msg.data.author.displayName,
          });
        }
      }
    });

    // Sort by recency
    results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (err) {
    console.error("Search API Match Failed:", err);
    return NextResponse.json(
      { error: "Search failed", details: String(err) },
      { status: 500 },
    );
  }
}
