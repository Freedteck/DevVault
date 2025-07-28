import { MetaMaskClient } from "@/client/metamaskClient";
import { WalletConnectClient } from "@/client/walletConnectClient";
import { UserMetamaskContext } from "@/context/userMetamaskContext";
import { userWalletContext } from "@/context/userWalletContext";
import { useContext } from "react";

// Purpose: This hook is used to determine which wallet interface to use
// Example: const { accountId, walletInterface } = useWalletInterface();
// Returns: { accountId: string | null, walletInterface: WalletInterface | null }
export const useWalletInterface = () => {
  const { metamaskAccount, disconnectMetamask } =
    useContext(UserMetamaskContext);
  const { accountId, disconnectWallet } = useContext(userWalletContext);

  if (metamaskAccount) {
    return {
      accountId: metamaskAccount,
      walletInterface: MetaMaskClient,
      disconnect: disconnectMetamask,
    };
  } else if (accountId) {
    return {
      accountId: accountId,
      walletInterface: WalletConnectClient,
      disconnect: disconnectWallet,
    };
  } else {
    return {
      accountId: null,
      walletInterface: null,
      disconnect: () => {
        console.warn("No wallet connected to disconnect.");
      },
    };
  }
};
