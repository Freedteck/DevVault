import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * POST /api/revalidate
 *
 * Triggers manual revalidation of cached pages.
 * Called after successful HCS submission to ensure the user sees their content instantly.
 */
export async function POST(req: NextRequest) {
  try {
    const { path, secret } = await req.json();

    // Check for secret to prevent unauthorized cache purging
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    revalidatePath(path);
    console.log(`[Revalidation] Path purged: ${path}`);

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: "Revalidation failed", details: String(err) },
      { status: 500 },
    );
  }
}
