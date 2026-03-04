import { NextRequest, NextResponse } from "next/server";
import {
  getTopicMessages,
  getTokenInfo,
  getTopicInfo,
} from "@/lib/hedera-mirror";
import type { HCSQuestionPayload } from "@/lib/hcs-types";

export async function GET(req: NextRequest) {
  const dvtTokenId = process.env.NEXT_PUBLIC_DVT_TOKEN_ID!;
  const questionsTopicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;
  const registryTopicId = process.env.NEXT_PUBLIC_REGISTRY_TOPIC_ID!;

  try {
    const [tokenInfo, registryInfo, questionMsgs] = await Promise.all([
      getTokenInfo(dvtTokenId).catch(() => ({ totalSupply: "0", decimals: 2 })),
      getTopicInfo(registryTopicId).catch(() => ({ sequenceNumber: 0 })),
      getTopicMessages<HCSQuestionPayload>(questionsTopicId, 50).catch(
        () => [],
      ),
    ]);

    // DVT Circulation
    const circulation =
      Number(tokenInfo.totalSupply) / Math.pow(10, tokenInfo.decimals);

    // Experts (using Registry sequence number as a proxy for total registered users)
    const experts = registryInfo.sequenceNumber;

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
