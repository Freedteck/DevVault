import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/root/Root";
import Home from "./routes/home/Home";
import Discussions from "./routes/discussions/Discussions";
import AskAndBuild from "./routes/askAndBuild/AskAndBuild";
import Updates from "./routes/updates/Updates";
import Leaderboard from "./routes/leaderboard/Leaderboard";
import WalletContext from "./context/WalletContext";
import QuestionDetails from "./routes/questionDetails/QuestionDetails";
import UpdateDetails from "./routes/updateDetails/UpdateDetails";
import Profile from "./routes/profile/Profile";
import Analytics from "./routes/analytics/Analytics";
import GTM from "./routes/gtm/GTM";
import LLMTraining from "./routes/llmTraining/LLMTraining";
import ToastProvider from "./components/toast/ToastProvider";

const router = createBrowserRouter([
  {
    path: "",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "discussions",
        element: <Discussions />,
        children: [
          {
            index: true,
            element: <AskAndBuild />,
          },
          {
            path: "updates",
            element: <Updates />,
          },
        ],
      },
      {
        path: "question/:id",
        element: <QuestionDetails />,
      },
      {
        path: "update/:id",
        element: <UpdateDetails />,
      },
      {
        path: "leaderboard",
        element: <Leaderboard />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "gtm",
        element: <GTM />,
      },
      {
        path: "llm-training",
        element: <LLMTraining />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WalletContext>
      <ToastProvider />
      <RouterProvider router={router} />
    </WalletContext>
  </StrictMode>
);
