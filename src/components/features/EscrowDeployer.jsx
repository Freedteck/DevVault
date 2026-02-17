import { useState, useContext } from "react";
import toast from "react-hot-toast";
import { userWalletContext } from "../../context/userWalletContext";
import { deployEscrowContract } from "../../client/escrowContract";
import Button from "../ui/Button";
import Card from "../ui/Card";

const EscrowDeployer = () => {
  const { accountId, walletData } = useContext(userWalletContext);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);

  const handleDeploy = async () => {
    if (!accountId || !walletData) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsDeploying(true);
    setDeployResult(null);

    try {
      const [contractId, transactionId] = await deployEscrowContract(
        walletData,
        accountId
      );
      setDeployResult({
        success: true,
        contractId: contractId.toString(),
        transactionId: transactionId.toString(),
      });
      toast.success("Escrow contract deployed successfully!");
    } catch (error) {
      console.error("Deployment failed:", error);
      setDeployResult({
        success: false,
        error: error.message,
      });
      toast.error("Deployment failed. Check console for details.");
    } finally {
      setIsDeploying(false);
    }
  };

  if (!accountId) {
    return null; // Don't show if wallet not connected
  }

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Deploy Escrow Contract</h3>
      <p className="text-sm text-gray-600 mb-4">
        Deploy the bounty escrow smart contract. This needs to be done once
        before using the escrow system.
      </p>

      <Button onClick={handleDeploy} disabled={isDeploying} className="w-full">
        {isDeploying ? "Deploying..." : "Deploy Escrow Contract"}
      </Button>

      {deployResult && (
        <div
          className={`mt-4 p-3 rounded ${
            deployResult.success
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {deployResult.success ? (
            <div>
              <p>
                <strong>Contract ID:</strong> {deployResult.contractId}
              </p>
              <p>
                <strong>Transaction ID:</strong> {deployResult.transactionId}
              </p>
              <p className="text-sm mt-2">
                Update your .env.local file with: VITE_ESCROW_CONTRACT_ID=
                {deployResult.contractId}
              </p>
            </div>
          ) : (
            <p>
              <strong>Error:</strong> {deployResult.error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default EscrowDeployer;
