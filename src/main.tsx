import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import WalletContext from "./context/WalletContext.tsx";
import MetamaskContext from "./context/MetamaskContext.tsx";

createRoot(document.getElementById("root")!).render(
  <WalletContext>
    <MetamaskContext>
      <App />
    </MetamaskContext>
  </WalletContext>
);
