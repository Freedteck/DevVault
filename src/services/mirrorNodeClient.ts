import { networkConfig } from "@/config/networks";
import { AccountId } from "@hashgraph/sdk";

const TOPIC_ID = import.meta.env.VITE_TOPIC_ID;
const TOKEN_ID = import.meta.env.VITE_TOKEN_ID;
const NFT_TOKEN_ID = import.meta.env.VITE_NFT_TOKEN_ID;

export const MirrorNodeClient = async () => {
  const url = networkConfig.testnet.mirrorNodeUrl;

  const getAccountInfo = async (accountId: AccountId) => {
    const accountInfo = await fetch(`${url}/api/v1/accounts/${accountId}`, {
      method: "GET",
    });
    const accountInfoJson = await accountInfo.json();
    return accountInfoJson;
  };

  const getTopicMessages = async (
    topicId = TOPIC_ID,
    limit = 100 // Use the max limit to reduce the number of requests
  ) => {
    let nextUrl = `/api/v1/topics/${topicId}/messages?limit=${limit}`;
    const messages = [];
    let urlPrefix = url; // Base URL for the mirror node

    while (nextUrl) {
      const fetchUrl = nextUrl.startsWith("http")
        ? nextUrl
        : `${urlPrefix}${nextUrl}`;
      const response = await fetch(fetchUrl, { method: "GET" });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch topic messages: ${response.statusText}`
        );
      }
      const data = await response.json();

      // Process and accumulate messages as in your original function
      let currentMessage = "";
      let messageStart = null;

      data.messages.forEach((message) => {
        try {
          const decodedMessage = atob(message.message);
          if (decodedMessage.trim().startsWith("{")) {
            if (currentMessage && messageStart) {
              try {
                const parsedMessage = JSON.parse(currentMessage);
                messages.push({
                  timestamp: messageStart,
                  data: parsedMessage,
                });
              } catch (err) {
                console.warn(
                  "Failed to parse accumulated message:",
                  currentMessage
                );
              }
            }
            currentMessage = decodedMessage;
            messageStart = message.consensus_timestamp;
          } else {
            currentMessage += decodedMessage;
          }
        } catch (err) {
          console.warn("Skipping malformed message:", err);
        }
      });

      // Handle the last message in this page
      if (currentMessage && messageStart) {
        try {
          const parsedMessage = JSON.parse(currentMessage);
          messages.push({
            timestamp: messageStart,
            data: parsedMessage,
          });
        } catch (err) {
          console.warn(
            "Failed to parse final accumulated message:",
            currentMessage
          );
        }
      }

      nextUrl = data.links.next;
    }

    return {
      messages: messages.reverse(), // Most recent first
    };
  };

  const getTokenBalance = async (accountId: AccountId) => {
    if (!TOKEN_ID) {
      throw new Error("TOKEN_ID is not defined in environment variables");
    }
    if (accountId) {
      const tokenRequest = await fetch(
        `${url}/api/v1/tokens/${TOKEN_ID}/balances?account.id=${accountId}`,
        {
          method: "GET",
        }
      );
      const tokenData = await tokenRequest.json();

      return tokenData.balances[0]?.balance || "0";
    } // Return 0 if accountId is not provided
  };

  const getNftBalance = async (accountId: AccountId) => {
    if (!NFT_TOKEN_ID) {
      throw new Error("NFT_TOKEN_ID is not defined in environment variables");
    }
    if (accountId) {
      const userNfts = await fetch(`${url}/api/v1/accounts/${accountId}/nfts`);
      const nftJson = await userNfts.json();

      const profileNfts = nftJson?.nfts?.filter(
        (nft) => nft.token_id === NFT_TOKEN_ID
      );

      return profileNfts?.map((nft) => ({
        serialNumber: nft.serial_number,
        metadata: nft.metadata,
        created_timestamp: nft.created_timestamp,
      }));
    }
  };

  const getNftDetails = async (serialNumber: number) => {
    if (!NFT_TOKEN_ID) {
      throw new Error("NFT_TOKEN_ID is not defined in environment variables");
    }
    const nftDetails = await fetch(
      `${url}/api/v1/tokens/${NFT_TOKEN_ID}/nfts/${serialNumber}`
    );
    const nftJson = await nftDetails.json();
    return nftJson;
  };

  async function getAccountTransactions(
    accountId,
    tokenId = TOKEN_ID,
    startTimestamp = null,
    endTimestamp = null
  ) {
    const url = "https://testnet.mirrornode.hedera.com";
    let baseUrl = `${url}/api/v1/transactions?account.id=${accountId}&transactiontype=CRYPTOTRANSFER&limit=100`;
    if (startTimestamp && endTimestamp) {
      baseUrl += `&timestamp=gte:${startTimestamp}&timestamp=lt:${endTimestamp}`;
    }

    let transactions = [];
    let nextLink = baseUrl;

    while (nextLink) {
      const response = await fetch(nextLink);
      const data = await response.json();

      // Filter for token transfers involving the specified tokenId
      const relevantTxs = data.transactions.filter(
        (tx) =>
          tx.token_transfers &&
          tx.token_transfers.some(
            (t) => t.token_id === tokenId && t.account === accountId
          )
      );
      transactions.push(...relevantTxs);

      nextLink = data.links && data.links.next ? url + data.links.next : null;
    }

    return transactions;
  }

  return {
    getAccountInfo,
    getTopicMessages,
    getTokenBalance,
    getNftBalance,
    getNftDetails,
    getAccountTransactions,
  };
};
