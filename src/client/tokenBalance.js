import { AccountBalanceQuery, Client } from "@hashgraph/sdk";

// Get Token Balance Function
const tokenBalanceFcn = async (accountId, tokenId) => {
  try {
    // Initialize the Hedera client for testnet
    const client = Client.forTestnet();

    // Perform the AccountBalanceQuery with the account ID
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);

    // Extract the balance for the specific token ID
    const tokenBalance = accountBalance.tokens.get(tokenId)?.toString() || "0";

    console.log(
      `The token balance for token ID ${tokenId}: ${tokenBalance} Tokens`
    );

    return tokenBalance;
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return null;
  }
};

export default tokenBalanceFcn;
