export const revalidate = 60;

import { NextRequest } from "next/server";
import { fetchQuestionBySequenceNumber } from "../../../../services/fetchService";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ sequenceNumber: string }> },
) => {
  try {
    const { sequenceNumber } = await params;
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
    if (!gateway) {
      throw new Error("PINATA_GATEWAY is not defined");
    }

    const question = await fetchQuestionBySequenceNumber(
      parseInt(sequenceNumber),
      gateway,
    );
    return Response.json(question);
  } catch (err) {
    console.error("Error fetching question:", err);
    return Response.json(
      { error: "Failed to fetch question" },
      { status: 500 },
    );
  }
};
