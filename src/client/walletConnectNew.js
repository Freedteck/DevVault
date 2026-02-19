import {
  DAppConnector,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  HederaChainId,
} from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hiero-ledger/sdk";

let dAppConnector = null;

/**
 * Initialize DAppConnector and restore any existing sessions
 * @param {boolean} openModal - Whether to open the wallet modal
 */
async function initDAppConnector(openModal = true) {
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

    // Check if there are existing sessions (auto-reconnect)
    if (dAppConnector.signers && dAppConnector.signers.length > 0) {
      console.log("- Restored existing session");
      return dAppConnector;
    }

    // Only open modal if requested and no existing session
    if (openModal) {
      await dAppConnector.openModal();
      console.log("- Wallet connected");
    }

    return dAppConnector;
  } catch (error) {
    console.error("Error initializing DAppConnector:", error);
    throw error;
  }
}

async function walletConnectFcn() {
  console.log(`\n=======================================`);
  console.log("- Connecting wallet with Hedera Wallet Connect...");
  return initDAppConnector(true);
}

async function disconnectWallet() {
  if (dAppConnector) {
    try {
      await dAppConnector.disconnectAll();
    } catch (e) {
      console.warn("- disconnectAll error (ignored):", e);
    }
    dAppConnector = null;
    console.log("- Wallet disconnected");
  }
}

export { walletConnectFcn, disconnectWallet, initDAppConnector };
export default walletConnectFcn;
