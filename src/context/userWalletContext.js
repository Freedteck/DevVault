import { createContext } from "react";

export const userWalletContext = createContext({
  walletData: null,
  accountId: null,
  connectWallet: () => {},
  // disconnectWallet: () => {},
});
