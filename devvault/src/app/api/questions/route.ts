import { NextRequest, NextResponse } from "next/server";
import { createDiscussionTopic } from "@/lib/hedera-sdk";
import { uploadToIPFS } from "@/lib/ipfs";

/**
 * POST /api/questions
 *
 * Platform coordination endpoint for new questions.
 *
 * What the platform does here (operator signs):
 *   1. Creates a dedicated HCS discussion topic for this question's answers.
 *      (The platform pays for this infra-level transaction.)
 *   2. Uploads the question body to IPFS via Pinata (if PINATA_JWT is set),
 *      returning the CID so the HCS payload can reference it instead of
 *      embedding the full text (which may exceed the 1024-byte HCS limit).
 *
 * What the platform does NOT do:
 *   - Sign or submit the HCS message containing the question content.
 *   - That is done CLIENT-SIDE by the user's wallet (see hedera-client-tx.ts → userPostQuestion)
 *
 * The client calls this first → gets { discussionTopicId, bodyCid } → then user wallet signs the HCS message.
 */
export async function POST(req: NextRequest) {
  try {
    let bodyCid: string | undefined;

    // Try to parse body text for IPFS upload; body may be absent on older clients
    try {
      const json = await req.json();
      if (json?.body && typeof json.body === "string" && json.body.length > 0) {
        bodyCid = await uploadToIPFS(
          json.body,
          `question-${Date.now()}`,
        ).catch((err) => {
          // Non-fatal: log and continue without IPFS if Pinata is not configured
          console.warn("[POST /api/questions] IPFS upload skipped:", err.message);
          return undefined;
        });
      }
    } catch {
      // No body or not JSON — skip IPFS upload
    }

    // Platform creates the per-question discussion topic (operator pays)
    const discussionTopicId = await createDiscussionTopic();

    return NextResponse.json({
      success: true,
      discussionTopicId,
      ...(bodyCid && { bodyCid }),
    });
  } catch (err) {
    console.error("[POST /api/questions]", err);
    return NextResponse.json(
      { error: "Failed to create discussion topic", details: String(err) },
      { status: 500 },
    );
  }
}

