import { NextRequest, NextResponse } from "next/server";
import {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  TokenId,
} from "@hashgraph/sdk";

/**
 * POST /api/bounty/release-dvt
 *
 * Server-side operator releases escrowed DVT to the answerer.
 * Called by the question asker's client after accepting an answer.
 *
 * DVT bounty escrow flow:
 *   Lock:    user → operator    (client-side, userLockDVTBounty in hedera-client-tx.ts)
 *   Release: operator → answerer (server-side, this route)
 *
 * Body: { answererAccountId: string, amountDVT: number, discussionTopicId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { answererAccountId, amountDVT, discussionTopicId } =
      await req.json();

    if (!answererAccountId || !amountDVT || amountDVT <= 0) {
      return NextResponse.json(
        { error: "answererAccountId and amountDVT are required" },
        { status: 400 },
      );
    }

    const tokenId = process.env.NEXT_PUBLIC_DVT_TOKEN_ID;
    const operatorId = process.env.OPERATOR_ACCOUNT_ID;
    const operatorKeyStr = process.env.OPERATOR_PRIVATE_KEY;

    if (!tokenId || !operatorId || !operatorKeyStr) {
      return NextResponse.json(
        { error: "Server not configured for DVT transfers" },
        { status: 500 },
      );
    }

    // Build operator client
    let operatorKey: PrivateKey;
    if (operatorKeyStr.startsWith("0x")) {
      operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr.slice(2));
    } else {
      try {
        operatorKey = PrivateKey.fromStringDer(operatorKeyStr);
      } catch {
        operatorKey = PrivateKey.fromStringED25519(operatorKeyStr);
      }
    }

    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK;
    const mirrorBase =
      network === "mainnet"
        ? "https://mainnet.mirrornode.hedera.com/api/v1"
        : "https://testnet.mirrornode.hedera.com/api/v1";

    // Check that the answerer has already associated with the DVT token.
    // Token association requires the recipient's own signature — the operator
    // cannot force it. If not associated, return a specific error so the UI
    // can tell the answerer to associate before the bounty can be released.
    const assocRes = await fetch(
      `${mirrorBase}/accounts/${answererAccountId}/tokens?token.id=${tokenId}&limit=1`,
    );
    if (assocRes.ok) {
      const assocJson = await assocRes.json();
      const associated = (assocJson.tokens ?? []).length > 0;
      if (!associated) {
        return NextResponse.json(
          {
            error: "ANSWERER_NOT_ASSOCIATED",
            details: `Account ${answererAccountId} has not associated with the DVT token yet. Ask them to associate via the Swap page or their wallet before accepting.`,
          },
          { status: 422 },
        );
      }
    }

    const client =
      network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
    client.setOperator(AccountId.fromString(operatorId), operatorKey);

    const units = Math.round(amountDVT * 100); // 2 decimals

    const tx = await new TransferTransaction()
      .addTokenTransfer(
        TokenId.fromString(tokenId),
        AccountId.fromString(operatorId),
        -units,
      )
      .addTokenTransfer(
        TokenId.fromString(tokenId),
        AccountId.fromString(answererAccountId),
        units,
      )
      .execute(client);

    const receipt = await tx.getReceipt(client);
    if (receipt.status.toString() !== "SUCCESS") {
      throw new Error(`Transfer status: ${receipt.status}`);
    }

    console.log(
      `[release-dvt] ${amountDVT} DVT → ${answererAccountId} | topic: ${discussionTopicId} | tx: ${tx.transactionId}`,
    );

    return NextResponse.json({
      success: true,
      transactionId: tx.transactionId?.toString(),
    });
  } catch (err) {
    console.error("[POST /api/bounty/release-dvt]", err);
    return NextResponse.json(
      { error: "DVT release failed", details: String(err) },
      { status: 500 },
    );
  }
}
