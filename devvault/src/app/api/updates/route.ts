import { NextRequest, NextResponse } from "next/server";
import { createDiscussionTopic } from "@/lib/hedera-sdk";
import { uploadToIPFS } from "@/lib/ipfs";

/**
 * POST /api/updates
 *
 * Platform coordination for new community updates.
 *
 * What the platform does here (operator signs):
 *   1. Creates a dedicated HCS discussion topic for this update's comments.
 *   2. Uploads the update body to IPFS via Pinata (if configured),
 *      returning bodyCid for the HCS payload.
 *
 * What the platform does NOT do:
 *   - Sign the HCS UPDATE message — that's the user's wallet (hedera-client-tx.ts).
 */
export async function POST(req: NextRequest) {
  const updatesTopicId = process.env.NEXT_PUBLIC_UPDATES_TOPIC_ID;
  if (!updatesTopicId) {
    return NextResponse.json(
      { error: "Updates topic not configured" },
      { status: 500 },
    );
  }

  try {
    let bodyCid: string | undefined;

    try {
      const json = await req.json();
      if (json?.body && typeof json.body === "string" && json.body.length > 0) {
        bodyCid = await uploadToIPFS(
          json.body,
          `update-${Date.now()}`,
        ).catch((err) => {
          console.warn("[POST /api/updates] IPFS upload skipped:", err.message);
          return undefined;
        });
      }
    } catch {
      // No body or not JSON — skip IPFS upload
    }

    // Platform creates a discussion topic for comments on this update
    const discussionTopicId = await createDiscussionTopic();

    return NextResponse.json({
      success: true,
      updatesTopicId,
      discussionTopicId,
      ...(bodyCid && { bodyCid }),
    });
  } catch (err) {
    console.error("[POST /api/updates]", err);
    return NextResponse.json(
      { error: "Failed to set up update resources", details: String(err) },
      { status: 500 },
    );
  }
}

