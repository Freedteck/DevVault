import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { userWalletContext } from "./userWalletContext";
import {
  walletConnectFcn,
  disconnectWallet as disconnectWalletFcn,
  initDAppConnector,
} from "../client/walletConnectNew";
import accountBalance from "../client/accountBalance";

const WalletContextNew = ({ children }) => {
  const [walletData, setWalletData] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [balance, setBalance] = useState(null);

  const connectWallet = async () => {
    try {
      const dAppConnector = await walletConnectFcn();

      // Get the connected account from signers
      const signers = dAppConnector.signers;
      if (signers && signers.length > 0) {
        // Use the last signer (most recently selected account)
        const connectedAccountId = signers[signers.length - 1]
          .getAccountId()
          .toString();
        setAccountId(connectedAccountId);
        setWalletData(dAppConnector);

        // Store connection state for auto-reconnect
        localStorage.setItem("devvault_wallet_connected", "true");
        localStorage.setItem("devvault_account_id", connectedAccountId);

        console.log(`- Connected to account: ${connectedAccountId}`);
        console.log(
          `- Available accounts: ${signers.map((s) => s.getAccountId().toString()).join(", ")}`,
        );
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      // Clear stored connection state on error
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

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const autoReconnect = async () => {
      const wasConnected = localStorage.getItem("devvault_wallet_connected");
      if (wasConnected === "true" && !walletData) {
        console.log("- Auto-reconnecting wallet...");
        try {
          // Use initDAppConnector without opening modal to restore session
          const dAppConnector = await initDAppConnector(false);

          const signers = dAppConnector.signers;
          if (signers && signers.length > 0) {
            const connectedAccountId = signers[signers.length - 1]
              .getAccountId()
              .toString();
            setAccountId(connectedAccountId);
            setWalletData(dAppConnector);
            console.log(`- Auto-reconnected to account: ${connectedAccountId}`);
          } else {
            // No existing session, clear localStorage
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Fetch account balance when accountId changes
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

WalletContextNew.propTypes = {
  children: PropTypes.node,
};

export default WalletContextNew;
