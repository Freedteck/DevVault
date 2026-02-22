export const revalidate = 30;

import { NextRequest } from "next/server";
import { fetchComments } from "../../../../services/fetchService";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ parentId: string }> },
) => {
  try {
    const { parentId } = await params;
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
    if (!gateway) throw new Error("PINATA_GATEWAY is not defined");

    const comments = await fetchComments(parentId, gateway);
    return Response.json(comments);
  } catch (err) {
    console.error("Error fetching comments:", err);
    return Response.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
};
