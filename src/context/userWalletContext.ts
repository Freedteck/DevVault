import { register } from "module";
import { createContext } from "react";

export const userWalletContext = createContext({
  isLoading: false,
  walletData: null,
  accountId: null,
  userProfile: null,
  balance: null,
  connectWallet: () => {},
  disconnectWallet: () => {},
});
