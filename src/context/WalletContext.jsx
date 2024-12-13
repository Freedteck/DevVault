import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { userWalletContext } from "./userWalletContext";
import walletConnectFcn from "../client/walletConnect";
import accountBalance from "../client/accountBalance";

const WalletContext = ({ children }) => {
  const [walletData, setWalletData] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [balance, setBalance] = useState(null);

  const connectWallet = async () => {
    if (!accountId) {
      const wData = await walletConnectFcn();
      wData[0].pairingEvent.once((pairingData) => {
        pairingData.accountIds.forEach((id) => {
          setAccountId(id);
          console.log(`- Paired account ID: ${id}`);
          console.log("Fetching user profile data...");
        });
      });
      setWalletData(wData);
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

        // Check for a successful response
        if (!request.ok) {
          console.error(`Failed to fetch user profile: ${request.statusText}`);
          return;
        }

        const response = await request.json();
        console.log("- User profile data (parsed):", response);

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

  return (
    <userWalletContext.Provider
      value={{ walletData, accountId, connectWallet, userProfile, balance }}
    >
      {children}
    </userWalletContext.Provider>
  );
};

WalletContext.propTypes = {
  children: PropTypes.node,
};

export default WalletContext;
