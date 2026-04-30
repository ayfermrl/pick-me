import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { HomePage } from "./pages/HomePage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { CreateQuizPage } from "./pages/CreateQuizPage";
import { AuthPage } from "./pages/AuthPage";
import { JoinPage } from "./pages/JoinPage";
import { PlayPage } from "./pages/PlayPage";
import { ResultsPage } from "./pages/ResultsPage";
import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "templates", element: <TemplatesPage /> },
      { path: "create", element: <CreateQuizPage /> },
      { path: "create/:templateId", element: <CreateQuizPage /> },
      { path: "auth", element: <AuthPage /> },
      { path: "join/:roomId?", element: <JoinPage /> },
      { path: "play/:roomId/:questionIndex", element: <PlayPage /> },
      { path: "results/:roomId", element: <ResultsPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
