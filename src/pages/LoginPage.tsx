import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/constants";
import MetamaskLogo from "../assets/metamask-logo.svg";
import WalletConnectLogo from "../assets/walletconnect-logo.svg";
import { userWalletContext } from "@/context/userWalletContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { accountId } = useContext(userWalletContext);
  const { connectWallet } = useContext(userWalletContext);

  useEffect(() => {
    const getWalletDetails = async () => {
      if (accountId) {
        navigate("/");
      }
    };
    getWalletDetails();
  }, [accountId]);

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Connect to {APP_NAME}
          </CardTitle>
          <CardDescription className="text-center">
            Connect your wallet to access your account
          </CardDescription>
        </CardHeader>
        <div>
          <CardContent className="space-y-4"></CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="button" className="w-full" onClick={connectWallet}>
              <img
                src={WalletConnectLogo}
                alt="walletconnect logo"
                width={32}
              />
              WalletConnect
            </Button>
            {/* <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </div> */}
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
