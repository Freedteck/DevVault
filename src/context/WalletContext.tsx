import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { userWalletContext } from "./userWalletContext";
import accountBalance from "../client/accountBalance";
import walletConnectFcn from "../client/walletConnect";

const WalletContext = ({ children }) => {
  const [walletData, setWalletData] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [balance, setBalance] = useState(null);

  const connectWallet = async () => {
    const { dappConnector } = await walletConnectFcn();

    await dappConnector.openModal();
    const signer = dappConnector.signers[0];
    if (signer) {
      const userAccountId = signer.getAccountId().toString();
      setAccountId(userAccountId);
      setWalletData(dappConnector);
      localStorage.setItem("walletConnected", "true"); // save flag
    }
  };

  const disconnectWallet = async () => {
    if (walletData) {
      await walletData.disconnectAll();
      setAccountId(null);
      setUserProfile(null);
      setBalance(null);
      setWalletData(null);
      localStorage.removeItem("walletConnected");
      console.log("Disconnected from wallet");
    }
  };

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
          }
        );

        if (!request.ok) {
          console.error(`Failed to fetch user profile: ${request.statusText}`);
          return;
        }

        const response = await request.json();
        setUserProfile(response);
      } catch (error) {
        console.error("Error fetching user profile data:", error);
      }
    };

    getUserProfile();
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      const getBalance = async () => {
        const newBalance = await accountBalance(accountId);
        setBalance(newBalance);
      };
      getBalance().catch(console.error);
    }
  }, [accountId]);

  useEffect(() => {
    const restoreWalletConnection = async () => {
      if (localStorage.getItem("walletConnected") === "true") {
        const { dappConnector } = await walletConnectFcn();

        if (dappConnector.signers.length > 0) {
          const signer = dappConnector.signers[0];
          const userAccountId = signer.getAccountId().toString();

          setWalletData(dappConnector);
          setAccountId(userAccountId);

          const newBalance = await accountBalance(userAccountId);
          setBalance(newBalance);
        }
      }
    };

    restoreWalletConnection().catch(console.error);
  }, []);

  return (
    <userWalletContext.Provider
      value={{
        walletData,
        accountId,
        connectWallet,
        userProfile,
        balance,
        disconnectWallet,
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
