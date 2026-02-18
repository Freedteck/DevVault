import {
  DAppConnector,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  HederaChainId,
} from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hiero-ledger/sdk";

let dAppConnector = null;

async function walletConnectFcn() {
  console.log(`\n=======================================`);
  console.log("- Connecting wallet with Hedera Wallet Connect...");

  if (dAppConnector) {
    return dAppConnector;
  }

  const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error("VITE_WALLET_CONNECT_PROJECT_ID is required in .env file");
  }

  const metadata = {
    name: "DevVault",
    description: "A decentralized resource sharing platform for developers.",
    url: window.location.origin,
    icons: [
      "https://raw.githubusercontent.com/ed-marquez/hedera-dapp-days/testing/src/assets/hederaLogo.png",
    ],
  };

  try {
    dAppConnector = new DAppConnector(
      metadata,
      LedgerId.TESTNET,
      projectId,
      Object.values(HederaJsonRpcMethod),
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [HederaChainId.Testnet],
    );

    await dAppConnector.init({ logger: "error" });
    console.log("- DAppConnector initialized");

    // Open modal to connect wallet
    await dAppConnector.openModal();
    console.log("- Wallet connected");

    return dAppConnector;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
}

async function disconnectWallet() {
  if (dAppConnector) {
    await dAppConnector.disconnectAll();
    dAppConnector = null;
    console.log("- Wallet disconnected");
  }
}

export { walletConnectFcn, disconnectWallet };
export default walletConnectFcn;
