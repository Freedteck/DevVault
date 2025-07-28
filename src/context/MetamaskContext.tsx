// src/context/MetamaskProvider.jsx
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { connectToMetamask, getProvider } from "@/client/metaMaskConnect";
import { UserMetamaskContext } from "./userMetamaskContext";

const MetamaskContext = ({ children }) => {
  const [metamaskAccount, setMetamaskAccount] = useState(null);

  const connectMetamask = async () => {
    try {
      const accounts = await connectToMetamask();

      setMetamaskAccount(accounts[0]);
      localStorage.setItem("metamaskConnected", "true");
    } catch (err) {
      console.error("MetaMask connection failed", err);
    }
  };

  const disconnectMetamask = () => {
    setMetamaskAccount(null);
    localStorage.removeItem("metamaskConnected");
  };

  useEffect(() => {
    const restoreSession = async () => {
      if (localStorage.getItem("metamaskConnected") === "true") {
        const provider = getProvider();
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setMetamaskAccount(accounts[0]);
        }
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setMetamaskAccount(accounts[0]);
      } else {
        disconnectMetamask();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return (
    <UserMetamaskContext.Provider
      value={{ metamaskAccount, connectMetamask, disconnectMetamask }}
    >
      {children}
    </UserMetamaskContext.Provider>
  );
};

MetamaskContext.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MetamaskContext;
