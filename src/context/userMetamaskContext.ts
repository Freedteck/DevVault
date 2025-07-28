import { createContext } from "react";

export const UserMetamaskContext = createContext({
  metamaskAccount: null,
  connectMetamask: () => {},
  disconnectMetamask: () => {},
});
