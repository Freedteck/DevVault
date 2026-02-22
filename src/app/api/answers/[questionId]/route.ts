export const revalidate = 60;

import { NextRequest } from "next/server";
import { fetchAnswersForQuestion } from "../../../../services/fetchService";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) => {
  try {
    const { questionId } = await params;
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
    if (!gateway) {
      throw new Error("PINATA_GATEWAY is not defined");
    }

    const answers = await fetchAnswersForQuestion(questionId, gateway);
    return Response.json(answers);
  } catch (err) {
    console.error("Error fetching answers:", err);
    return Response.json({ error: "Failed to fetch answers" }, { status: 500 });
  }
};
