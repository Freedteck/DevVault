import React from "react";
import { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import Layout from "../components/layout/Layout";
import WalletContextNew from "../context/WalletContextNew";
import "../styles/globals.css";
import "../styles/theme.css";

export const metadata: Metadata = {
  title: "DevVault",
  description:
    "A platform for developers to showcase their skills and earn rewards through hackathons and challenges.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletContextNew>
          <Layout>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "rgba(15, 15, 20, 0.95)",
                  color: "#f1f5f9",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                },
              }}
            />
          </Layout>
        </WalletContextNew>
      </body>
    </html>
  );
}
