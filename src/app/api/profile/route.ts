import { NextResponse } from "next/server";
import { createDiscussionTopic } from "@/lib/hedera-sdk";

/**
 * POST /api/profile
 *
 * Platform coordination for HCS-11 profile setup.
 *
 * What the platform does here (operator signs):
 *   1. Creates a dedicated HCS topic to hold this user's profile messages.
 *      (The platform pays for topic creation.)
 *
 * What the platform does NOT do:
 *   - Post the PROFILE message — the user's wallet signs that (hedera-client-tx → userCreateProfile).
 *   - Update the user's account memo — the user's wallet signs that.
 *
 * Response: { profileTopicId: "0.0.XXXXX" }
 */
export async function POST() {
  try {
    const profileTopicId = await createDiscussionTopic();
    return NextResponse.json({ success: true, profileTopicId });
  } catch (err) {
    console.error("[POST /api/profile]", err);
    return NextResponse.json(
      { error: "Failed to create profile topic", details: String(err) },
      { status: 500 },
    );
  }
}
