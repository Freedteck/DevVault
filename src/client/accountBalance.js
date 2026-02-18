import { AccountBalanceQuery, Client } from "@hashgraph/sdk";

// Get Account Balance Function
const accountBalance = async (accountId) => {
  try {
    // Initialize the Hedera client for testnet
    const client = Client.forTestnet();

    // Execute the AccountBalanceQuery with the account ID
    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);

    // Extract the HBAR balance as a number
    const hbarBalance = balance.hbars.toBigNumber().toNumber();

    console.log(`Account balance for ${accountId}: ${hbarBalance} HBAR`);

    // Return just the number, formatted to 2 decimals
    return parseFloat(hbarBalance.toFixed(2));
  } catch (error) {
    console.error("Error fetching account balance:", error);
    return 0;
  }
};

export default accountBalance;
