import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Styles
import "./styles/apex-theme.css";
import "./styles/globals.css"; // Keep original index.css for basic resets if compatible, else remove

// Layouts
import ApexLayout from "./components/new/layout/ApexLayout";

import HomeNew from "./components/new/pages/Home";
import QuestionsNew from "./components/new/pages/Questions";
import QuestionDetailsNew from "./components/new/pages/QuestionDetails";
import UpdatesNew from "./components/new/pages/Updates";
import UpdateDetailsNew from "./components/new/pages/UpdateDetails";
import LeaderboardNew from "./components/new/pages/Leaderboard";
import ProfileNew from "./components/new/pages/Profile";

const router = createBrowserRouter([
  {
    path: "/",
    element: <ApexLayout />,
    children: [
      {
        index: true,
        element: <HomeNew />,
      },
      {
        path: "questions",
        element: <QuestionsNew />,
      },
      {
        path: "questions/:id",
        element: <QuestionDetailsNew />,
      },
      {
        path: "updates",
        element: <UpdatesNew />,
      },
      {
        path: "updates/:id",
        element: <UpdateDetailsNew />,
      },
      {
        path: "leaderboard",
        element: <LeaderboardNew />,
      },
      {
        path: "profile",
        element: <ProfileNew />,
      },
    ],
  },
]);

const AppNew = () => {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />
    </>
  );
};

export default AppNew;
