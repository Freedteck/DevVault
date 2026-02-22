export const revalidate = 60; // Revalidate every 60 seconds

import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";

import { fetchUpdates } from "../../../services/fetchService";

export const GET = async (request: NextRequest) => {
  try {
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
    if (!gateway) {
      throw new Error("PINATA_GATEWAY is not defined");
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit");
    let nextLink = searchParams.get("nextLink");

    // Handle "null" string from frontend
    if (nextLink === "null") nextLink = null;

    const result = await fetchUpdates(Number(limit) || 10, nextLink, gateway);
    return Response.json(result);
  } catch (err) {
    console.error("Error fetching updates:", err);
    return Response.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
};
