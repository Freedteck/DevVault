import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { userWalletContext } from "./userWalletContext";
import { walletConnectFcn, disconnectWallet } from "../client/walletConnectNew";

const WalletContextNew = ({ children }) => {
  const [walletData, setWalletData] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const connectWallet = async () => {
    try {
      const dAppConnector = await walletConnectFcn();

      // Get the connected account from signers
      const signers = dAppConnector.signers;
      if (signers && signers.length > 0) {
        const connectedAccountId = signers[0].getAccountId().toString();
        setAccountId(connectedAccountId);
        setWalletData(dAppConnector);
        console.log(`- Connected to account: ${connectedAccountId}`);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const disconnect = async () => {
    await disconnectWallet();
    setWalletData(null);
    setAccountId(null);
    setUserProfile(null);
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

  return (
    <userWalletContext.Provider
      value={{
        walletData,
        accountId,
        connectWallet,
        disconnect,
        userProfile,
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
