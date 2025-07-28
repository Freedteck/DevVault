import { ethers } from "ethers";

const { ethereum } = window as any;

export const getProvider = () => {
  if (!ethereum) throw new Error("MetaMask is not installed!");
  return new ethers.providers.Web3Provider(ethereum);
};

export const switchToHederaNetwork = async () => {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x128" }],
    });
  } catch (error) {
    if (error.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x128",
            chainName: "Hedera (Testnet)",
            nativeCurrency: {
              name: "HBAR",
              symbol: "HBAR",
              decimals: 18,
            },
            rpcUrls: ["https://testnet.hashio.io/api"],
          },
        ],
      });
    } else {
      throw error;
    }
  }
};

export const connectToMetamask = async () => {
  const provider = getProvider();
  await switchToHederaNetwork();
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts;
};
