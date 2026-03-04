import { NextRequest, NextResponse } from "next/server";
import { uploadToIPFS } from "@/lib/ipfs";

/**
 * POST /api/answers
 *
 * Coordinates answer submission:
 *   1. If the body exceeds INLINE_LIMIT chars, uploads the full Markdown to
 *      IPFS via Pinata (server-side, PINATA_JWT secret) and returns a bodyCid.
 *   2. Returns the discussionTopicId so the client's wallet can sign and
 *      submit the HCS message with an inline excerpt + optional bodyCid.
 *
 * If body <= INLINE_LIMIT, no IPFS upload occurs — the body goes inline in HCS.
 */

/** Max chars stored inline in HCS; anything longer goes to IPFS. */
const INLINE_LIMIT = 280;

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { discussionTopicId, body } = json;

    if (!discussionTopicId) {
      return NextResponse.json(
        { error: "discussionTopicId is required" },
        { status: 400 },
      );
    }

    let bodyCid: string | undefined;

    if (typeof body === "string" && body.length > INLINE_LIMIT) {
      bodyCid = await uploadToIPFS(body, `answer-${Date.now()}`).catch(
        (err) => {
          console.warn("[POST /api/answers] IPFS upload skipped:", err.message);
          return undefined;
        },
      );
    }

    return NextResponse.json({
      success: true,
      discussionTopicId,
      ...(bodyCid && { bodyCid }),
    });
  } catch (err) {
    console.error("[POST /api/answers]", err);
    return NextResponse.json(
      { error: "Invalid request", details: String(err) },
      { status: 400 },
    );
  }
}
