"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  DAppConnector,
  HederaSessionEvent,
  HederaChainId,
  HederaJsonRpcMethod,
} from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hashgraph/sdk";
import { getHCS11Profile } from "@/lib/hedera-mirror";

// Reown/WalletConnect Project ID - get yours at https://cloud.reown.com
// For the hackathon, you can create a free project.
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "vurso-hackathon-dev";

import type { HCS11Profile } from "@/lib/hedera-mirror";

interface WalletContextValue {
  accountId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isAccountActivated: boolean;
  isCheckingActivation: boolean;
  profile: HCS11Profile | null;
  connector: DAppConnector | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshActivationStatus: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>({
  accountId: null,
  isConnected: false,
  isConnecting: false,
  isAccountActivated: false,
  isCheckingActivation: false,
  profile: null,
  connector: null,
  connect: async () => {},
  disconnect: async () => {},
  refreshActivationStatus: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAccountActivated, setIsAccountActivated] = useState(false);
  const [isCheckingActivation, setIsCheckingActivation] = useState(false);
  const [profile, setProfile] = useState<HCS11Profile | null>(null);
  const [connector, setConnector] = useState<DAppConnector | null>(null);

  const isConnected = accountId !== null;

  const checkActivationStatus = useCallback(async (id: string) => {
    setIsCheckingActivation(true);
    try {
      const hcs11 = await getHCS11Profile(id);
      setIsAccountActivated(hcs11 !== null);
      setProfile(hcs11);
    } catch (err) {
      console.warn("Failed to check activation status:", err);
      setIsAccountActivated(false);
      setProfile(null);
    } finally {
      setIsCheckingActivation(false);
    }
  }, []);

  const refreshActivationStatus = useCallback(async () => {
    if (accountId) {
      await checkActivationStatus(accountId);
    }
  }, [accountId, checkActivationStatus]);

  // Clear profile on disconnect
  useEffect(() => {
    if (accountId) {
      checkActivationStatus(accountId);
    } else {
      setIsAccountActivated(false);
      setProfile(null);
    }
  }, [accountId, checkActivationStatus]);

  // Initialize DAppConnector on mount
  useEffect(() => {
    const init = async () => {
      const dappConnector = new DAppConnector(
        {
          name: "Vurso",
          description: "Decentralised developer knowledge network on Hedera",
          url:
            typeof window !== "undefined"
              ? window.location.origin
              : "https://vurso.xyz",
          icons: [
            `${typeof window !== "undefined" ? window.location.origin : ""}/favicon.ico`,
          ],
        },
        LedgerId.TESTNET,
        WALLETCONNECT_PROJECT_ID,
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [HederaChainId.Testnet],
      );

      await dappConnector.init({ logger: "warn" });
      setConnector(dappConnector);

      // Restore previous session if it exists
      const sessions = dappConnector.walletConnectClient?.session?.values;
      if (sessions && [...sessions].length > 0) {
        const session = [...sessions][0];
        const account = session.namespaces?.hedera?.accounts?.[0];
        if (account) {
          // Format: hedera:testnet:0.0.XXXXX → 0.0.XXXXX
          const id = account.split(":").pop() ?? null;
          setAccountId(id);
        }
      }
    };

    init().catch(console.error);
  }, []);

  const connect = useCallback(async () => {
    if (!connector) return;
    setIsConnecting(true);
    try {
      const session = await connector.openModal();
      const account = session?.namespaces?.hedera?.accounts?.[0];
      if (account) {
        const id = account.split(":").pop() ?? null;
        setAccountId(id);
      }
    } catch (err) {
      console.error("WalletConnect error:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [connector]);

  const disconnect = useCallback(async () => {
    if (!connector) return;
    try {
      await connector.disconnectAll();
    } finally {
      setAccountId(null);
    }
  }, [connector]);

  return (
    <WalletContext.Provider
      value={{
        accountId,
        isConnected,
        isConnecting,
        isAccountActivated,
        isCheckingActivation,
        profile,
        connector,
        connect,
        disconnect,
        refreshActivationStatus,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
