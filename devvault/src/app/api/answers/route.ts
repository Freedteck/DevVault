import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/answers
 *
 * Answer / Comment submissions do NOT require a platform-side transaction.
 * The user's wallet signs and submits the HCS message directly to the question's
 * discussion topic via hedera-client-tx.ts → userPostAnswer() / userPostComment().
 *
 * This route validates the request and returns the discussion topic ID
 * so the client knows where to submit the answer.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { discussionTopicId } = body;

    if (!discussionTopicId) {
      return NextResponse.json(
        { error: "discussionTopicId is required" },
        { status: 400 },
      );
    }

    // Return the topic ID so the client can submit via user's wallet
    return NextResponse.json({ success: true, discussionTopicId });
  } catch (err) {
    console.error("[POST /api/answers]", err);
    return NextResponse.json(
      { error: "Invalid request", details: String(err) },
      { status: 400 },
    );
  }
}
