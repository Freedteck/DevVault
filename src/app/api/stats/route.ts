import { NextRequest, NextResponse } from "next/server";
import {
  getTopicMessages,
  getTokenInfo,
  getTokenHolderCount,
} from "@/lib/hedera-mirror";
import type { HCSQuestionPayload } from "@/lib/hcs-types";

export async function GET(req: NextRequest) {
  const vrsTokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID!;
  const questionsTopicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;

  try {
    const [tokenInfo, experts, questionMsgs] = await Promise.all([
      getTokenInfo(vrsTokenId).catch(() => ({ totalSupply: "0", decimals: 2 })),
      getTokenHolderCount(vrsTokenId).catch(() => 0),
      getTopicMessages<HCSQuestionPayload>(questionsTopicId, 50).catch(
        () => [],
      ),
    ]);

    // VRS Circulation
    const circulation =
      Number(tokenInfo.totalSupply) / Math.pow(10, tokenInfo.decimals);

    // Hot Bounties (Filter for questions with bountyAmount > 0, sort by amount desc)
    const hotBounties = questionMsgs
      .filter(
        (m) => m.data?.type === "QUESTION" && (m.data.bountyAmount || 0) > 0,
      )
      .map((m) => ({
        id: m.sequenceNumber.toString(),
        title: (m.data as HCSQuestionPayload).title,
        amount: `${(m.data as HCSQuestionPayload).bountyAmount} ${(m.data as HCSQuestionPayload).bountyCurrency}`,
        value: (m.data as HCSQuestionPayload).bountyAmount || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    return NextResponse.json({
      circulation,
      experts,
      hotBounties,
    });
  } catch (err) {
    console.error("Stats API Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
