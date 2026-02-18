import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { Toaster } from "react-hot-toast";
import WalletContextNew from "./context/WalletContextNew";
import AppNew from "./AppNew";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WalletContextNew>
      <AppNew />
    </WalletContextNew>
  </StrictMode>,
);
