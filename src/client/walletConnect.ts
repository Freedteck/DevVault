import {
  DAppConnector,
  HederaChainId,
  HederaJsonRpcMethod,
  HederaSessionEvent,
} from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hashgraph/sdk";

let dappConnectorInstance = null;

async function walletConnectFcn() {
  if (dappConnectorInstance) return { dappConnector: dappConnectorInstance };

  const walletConnectProjectId = "377d75bb6f86a2ffd427d032ff6ea7d3";

  const appMetadata = {
    name: "DeVault",
    description: "A decentralized resource sharing platform for developers.",
    icons: [window.location.origin + "/logo192.png"],
    url: window.location.origin,
  };

  const dappConnector = new DAppConnector(
    appMetadata,
    LedgerId.TESTNET,
    walletConnectProjectId,
    Object.values(HederaJsonRpcMethod),
    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
    [HederaChainId.Testnet]
  );

  await dappConnector.init(); // Loads existing session if any

  dappConnectorInstance = dappConnector;
  return { dappConnector };
}

export default walletConnectFcn;
