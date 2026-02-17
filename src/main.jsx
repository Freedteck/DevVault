import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./pages/root";
import Home from "./pages/home";
import Discussions from "./pages/discussions";
import Questions from "./pages/questions";
import Updates from "./pages/updates";
import QuestionDetails from "./pages/questionDetails";
import UpdateDetails from "./pages/updateDetails";
import Leaderboard from "./pages/leaderboard";
import Profile from "./pages/profile";
import WalletContext from "./context/WalletContext";

const router = createBrowserRouter([
  {
    path: "/",
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
            element: <Questions />,
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
        path: "profile/:id?",
        element: <Profile />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WalletContext>
      <RouterProvider router={router} />
    </WalletContext>
  </StrictMode>
);
