"use client";

import { useEffect, useState } from "react";
import { userWalletContext } from "./userWalletContext";
import {
  walletConnectFcn,
  disconnectWallet as disconnectWalletFcn,
  initDAppConnector,
} from "../client/walletConnectNew";
import accountBalance from "../client/accountBalance";

const WalletContextNew = ({ children }: any) => {
  const [walletData, setWalletData] = useState<any>(null);
  const [accountId, setAccountId] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);

  const connectWallet = async () => {
    try {
      const dAppConnector = await walletConnectFcn();
      if (!dAppConnector) return;

      const signers = dAppConnector.signers;
      if (signers && signers.length > 0) {
        const connectedAccountId = signers[signers.length - 1]
          .getAccountId()
          .toString();
        setAccountId(connectedAccountId);
        setWalletData(dAppConnector);

        localStorage.setItem("devvault_wallet_connected", "true");
        localStorage.setItem("devvault_account_id", connectedAccountId);

        console.log(`- Connected to account: ${connectedAccountId}`);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      localStorage.removeItem("devvault_wallet_connected");
      localStorage.removeItem("devvault_account_id");
    }
  };

  const disconnect = async () => {
    try {
      await disconnectWalletFcn();
      console.log("- Wallet disconnected");
    } catch (error) {
      console.warn("Disconnect error (ignored):", error);
    } finally {
      setWalletData(null);
      setAccountId(null);
      setUserProfile(null);
      setBalance(null);
      localStorage.removeItem("devvault_wallet_connected");
      localStorage.removeItem("devvault_account_id");
    }
  };

  useEffect(() => {
    const autoReconnect = async () => {
      const wasConnected = localStorage.getItem("devvault_wallet_connected");
      if (wasConnected === "true" && !walletData) {
        console.log("- Auto-reconnecting wallet...");
        try {
          const dAppConnector = await initDAppConnector(false);
          if (!dAppConnector) {
            console.log("- No existing session found");
            localStorage.removeItem("devvault_wallet_connected");
            localStorage.removeItem("devvault_account_id");
            return;
          }

          const signers = dAppConnector.signers;
          if (signers && signers.length > 0) {
            const connectedAccountId = signers[signers.length - 1]
              .getAccountId()
              .toString();
            setAccountId(connectedAccountId);
            setWalletData(dAppConnector);
            console.log(`- Auto-reconnected to account: ${connectedAccountId}`);
          } else {
            console.log("- No existing session found");
            localStorage.removeItem("devvault_wallet_connected");
            localStorage.removeItem("devvault_account_id");
          }
        } catch (error) {
          console.error("- Auto-reconnect failed:", error);
          localStorage.removeItem("devvault_wallet_connected");
          localStorage.removeItem("devvault_account_id");
        }
      }
    };

    autoReconnect();
  }, []);

  useEffect(() => {
    const getUserProfile = async () => {
      if (!accountId) return;

      try {
        const request = await fetch(
          "https://api.hashpack.app/user-profile/get",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accountId: accountId, network: "testnet" }),
          },
        );

        if (!request.ok) {
          console.error(`Failed to fetch user profile: ${request.statusText}`);
          return;
        }

        const response = await request.json();
        console.log("- User profile data:", response);
        setUserProfile(response);
      } catch (error) {
        console.error("Error fetching user profile data:", error);
      }
    };

    getUserProfile();
  }, [accountId]);

  useEffect(() => {
    const getBalance = async () => {
      if (!accountId) return;

      try {
        console.log(`- Fetching balance for ${accountId}...`);
        const newBalance = await accountBalance(accountId);
        setBalance(newBalance);
        console.log(`- Balance fetched: ${newBalance} HBAR`);
      } catch (error) {
        console.error("Error fetching account balance:", error);
        setBalance(0);
      }
    };

    getBalance();
  }, [accountId]);

  return (
    <userWalletContext.Provider
      value={{
        walletData,
        accountId,
        connectWallet,
        disconnectWallet: disconnect,
        userProfile,
        balance,
      }}
    >
      {children}
    </userWalletContext.Provider>
  );
};

export default WalletContextNew;
