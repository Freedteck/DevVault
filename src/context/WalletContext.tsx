import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { userWalletContext } from "./userWalletContext";
import accountBalance from "../client/accountBalance";
import walletConnectFcn from "../client/walletConnect";
import { getProfile } from "@/lib/supabase";
import { MirrorNodeClient } from "@/services/mirrorNodeClient";

const WalletContext = ({ children }) => {
  const [walletData, setWalletData] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true for initial load
  const [signer, setSigner] = useState(null);

  const getUserProfile = useCallback(async () => {
    if (!accountId) {
      setUserProfile(null);
      return;
    }

    try {
      const { success, data } = await getProfile(accountId.toString());
      const { getTokenBalance } = await MirrorNodeClient();
      const tokenBalance = await getTokenBalance(accountId);
      if (success) {
        setUserProfile({ ...data, tokenBalance });
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    }
  }, [accountId]);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      const { dappConnector } = await walletConnectFcn();
      await dappConnector.openModal();
      const signer = dappConnector.signers[0];
      if (signer) {
        const userAccountId = signer.getAccountId().toString();
        setAccountId(userAccountId);
        setWalletData(dappConnector);
        setSigner(signer);
        localStorage.setItem("walletConnected", "true");
        console.log("Connected to wallet:", userAccountId);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (walletData) {
        await walletData.disconnectAll();
      }
      setAccountId(null);
      setUserProfile(null);
      setBalance(null);
      setWalletData(null);
      localStorage.removeItem("walletConnected");
      console.log("Disconnected from wallet");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  // Handle wallet connection restoration on mount
  useEffect(() => {
    const restoreWalletConnection = async () => {
      try {
        if (localStorage.getItem("walletConnected") === "true") {
          const { dappConnector } = await walletConnectFcn();

          if (dappConnector.signers.length > 0) {
            const signer = dappConnector.signers[0];
            const userAccountId = signer.getAccountId().toString();

            setWalletData(dappConnector);
            setAccountId(userAccountId);
            setSigner(signer);

            // Get balance
            const newBalance = await accountBalance(userAccountId);
            setBalance(newBalance);
          }
        }
      } catch (error) {
        console.error("Error restoring wallet connection:", error);
        // Clean up if restoration fails
        localStorage.removeItem("walletConnected");
      } finally {
        setIsLoading(false);
      }
    };

    restoreWalletConnection();
  }, []); // Empty dependency array - only run on mount

  // Handle user profile fetching when accountId changes
  useEffect(() => {
    getUserProfile();
  }, [getUserProfile]);

  // Handle balance updates when accountId changes
  useEffect(() => {
    if (accountId) {
      const getBalance = async () => {
        try {
          const newBalance = await accountBalance(accountId);
          setBalance(newBalance);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      };
      getBalance();
    } else {
      setBalance(null);
    }
  }, [accountId]);

  return (
    <userWalletContext.Provider
      value={{
        isLoading,
        walletData,
        accountId,
        connectWallet,
        userProfile,
        balance,
        disconnectWallet,
        signer,
      }}
    >
      {children}
    </userWalletContext.Provider>
  );
};

WalletContext.propTypes = {
  children: PropTypes.node,
};

export default WalletContext;
