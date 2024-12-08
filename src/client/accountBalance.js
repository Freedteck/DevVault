import { AccountBalanceQuery, Client } from "@hashgraph/sdk";

// Get Account Balance Function
const tokenBalanceFcn = async (accountId) => {
  try {
    // Initialize the Hedera client for testnet
    const client = Client.forTestnet();

    // Execute the AccountBalanceQuery with the account ID
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);

    // Extract the HBAR balance
    const hbarBalance = accountBalance.hbars.toString();

    const formattedBalance = parseFloat(hbarBalance).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formattedBalance + " HBAR";
  } catch (error) {
    console.error("Error fetching account balance:", error);
    return null;
  }
};

export default tokenBalanceFcn;
