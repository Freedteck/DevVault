import { useState } from "react";
import PropTypes from "prop-types";
import { userWalletContext } from "./userWalletContext";
import walletConnectFcn from "../client/walletConnect";

const WalletContext = ({ children }) => {
  const [walletData, setWalletData] = useState(null);
  const [accountId, setAccountId] = useState(null);

  const connectWallet = async () => {
    if (!accountId) {
      const wData = await walletConnectFcn();
      wData[0].pairingEvent.once((pairingData) => {
        pairingData.accountIds.forEach((id) => {
          setAccountId(id);
          console.log(`- Paired account id: ${id}`);
        });
      });
      setWalletData(wData);
    }
  };

  return (
    <userWalletContext.Provider
      value={{ walletData, accountId, connectWallet }}
    >
      {children}
    </userWalletContext.Provider>
  );
};

WalletContext.propTypes = {
  children: PropTypes.node,
};

export default WalletContext;
