import {
  METAMASK_GAS_LIMIT_ASSOCIATE,
  METAMASK_GAS_LIMIT_TRANSFER_FT,
  METAMASK_GAS_LIMIT_TRANSFER_NFT,
} from "@/config/constants";
import { ContractFunctionParameterBuilder } from "@/services/wallets/contractFunctionParameterBuilder";
import { AccountId, ContractId, TokenId } from "@hashgraph/sdk";
import { ethers } from "ethers";

export const MetaMaskClient = (provider: any) => {
  const convertAccountIdToSolidityAddress = (accountId: AccountId): string => {
    const accountIdString =
      accountId.evmAddress !== null
        ? accountId.evmAddress.toString()
        : accountId.toSolidityAddress();

    return `0x${accountIdString}`;
  };

  // Purpose: Transfer HBAR
  // Returns: Promise<string>
  // Note: Use JSON RPC Relay to search by transaction hash
  const transferHBAR = async (toAddress: AccountId, amount: number) => {
    const signer = await provider.getSigner();
    // build the transaction
    const tx = await signer.populateTransaction({
      to: convertAccountIdToSolidityAddress(toAddress),
      value: ethers.utils.parseEther(amount.toString()),
    });
    try {
      // send the transaction
      const { hash } = await signer.sendTransaction(tx);
      await provider.waitForTransaction(hash);

      return hash;
    } catch (error: any) {
      console.warn(error.message ? error.message : error);
      return null;
    }
  };

  const transferFungibleToken = async (
    toAddress: AccountId,
    tokenId: TokenId,
    amount: number
  ) => {
    const hash = await executeContractFunction(
      ContractId.fromString(tokenId.toString()),
      "transfer",
      new ContractFunctionParameterBuilder()
        .addParam({
          type: "address",
          name: "recipient",
          value: convertAccountIdToSolidityAddress(toAddress),
        })
        .addParam({
          type: "uint256",
          name: "amount",
          value: amount,
        }),
      METAMASK_GAS_LIMIT_TRANSFER_FT
    );

    return hash;
  };

  const transferNonFungibleToken = async (
    toAddress: AccountId,
    tokenId: TokenId,
    serialNumber: number
  ) => {
    const addresses = await provider.listAccounts();
    const hash = await executeContractFunction(
      ContractId.fromString(tokenId.toString()),
      "transferFrom",
      new ContractFunctionParameterBuilder()
        .addParam({
          type: "address",
          name: "from",
          value: addresses[0],
        })
        .addParam({
          type: "address",
          name: "to",
          value: convertAccountIdToSolidityAddress(toAddress),
        })
        .addParam({
          type: "uint256",
          name: "nftId",
          value: serialNumber,
        }),
      METAMASK_GAS_LIMIT_TRANSFER_NFT
    );

    return hash;
  };

  const associateToken = async (tokenId: TokenId) => {
    // send the transaction
    // convert tokenId to contract id
    const hash = await executeContractFunction(
      ContractId.fromString(tokenId.toString()),
      "associate",
      new ContractFunctionParameterBuilder(),
      METAMASK_GAS_LIMIT_ASSOCIATE
    );

    return hash;
  };

  // Purpose: build contract execute transaction and send to hashconnect for signing and execution
  // Returns: Promise<TransactionId | null>
  const executeContractFunction = async (
    contractId: ContractId,
    functionName: string,
    functionParameters,
    gasLimit: number
  ) => {
    const signer = await provider.getSigner();
    const abi = [
      `function ${functionName}(${functionParameters.buildAbiFunctionParams()})`,
    ];

    // create contract instance for the contract id
    // to call the function, use contract[functionName](...functionParameters, ethersOverrides)
    const contract = new ethers.Contract(
      `0x${contractId.toSolidityAddress()}`,
      abi,
      signer
    );
    try {
      const txResult = await contract[functionName](
        ...functionParameters.buildEthersParams(),
        {
          gasLimit: gasLimit === -1 ? undefined : gasLimit,
        }
      );
      return txResult.hash;
    } catch (error: any) {
      console.warn(error.message ? error.message : error);
      return null;
    }
  };

  return {
    transferHBAR,
    transferFungibleToken,
    transferNonFungibleToken,
    associateToken,
  };
};
