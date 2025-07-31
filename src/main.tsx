import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import WalletContext from "./context/WalletContext.tsx";
import ContentDataContext from "./context/ContentDataContext.tsx";

createRoot(document.getElementById("root")!).render(
  <WalletContext>
    <ContentDataContext>
      <App />
    </ContentDataContext>
  </WalletContext>
);
