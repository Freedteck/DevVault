import { NextResponse } from "next/server";
import { createDiscussionTopic } from "@/lib/hedera-sdk";

/**
 * POST /api/questions/topic
 *
 * Platform-only action: creates a new HCS discussion topic for a question.
 * The operator pays for this infrastructure transaction.
 *
 * The actual HCS message (question body) is signed and submitted by the
 * USER'S WALLET client-side — NOT by the platform.
 */
export async function POST() {
  try {
    const discussionTopicId = await createDiscussionTopic();

    return NextResponse.json({
      success: true,
      discussionTopicId,
    });
  } catch (err) {
    console.error("[POST /api/questions/topic]", err);
    return NextResponse.json(
      { error: "Failed to create discussion topic", details: String(err) },
      { status: 500 },
    );
  }
}
