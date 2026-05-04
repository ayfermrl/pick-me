import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./components/AppLayout";
import "./styles.css";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage").then((module) => ({ default: module.TemplatesPage })));
const CreateQuizPage = lazy(() => import("./pages/CreateQuizPage").then((module) => ({ default: module.CreateQuizPage })));
const AuthPage = lazy(() => import("./pages/AuthPage").then((module) => ({ default: module.AuthPage })));
const JoinPage = lazy(() => import("./pages/JoinPage").then((module) => ({ default: module.JoinPage })));
const PlayPage = lazy(() => import("./pages/PlayPage").then((module) => ({ default: module.PlayPage })));
const ResultsPage = lazy(() => import("./pages/ResultsPage").then((module) => ({ default: module.ResultsPage })));
const AboutPage = lazy(() => import("./pages/InfoPages").then((module) => ({ default: module.AboutPage })));
const PrivacyPage = lazy(() => import("./pages/InfoPages").then((module) => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import("./pages/InfoPages").then((module) => ({ default: module.TermsPage })));

function PageLoader() {
  return (
    <section className="mx-auto max-w-2xl panel-card text-center">
      <h1 className="text-4xl font-black">Pick Me hazırlanıyor</h1>
      <p className="mt-3 leading-7 text-slate-600">Sayfa yükleniyor.</p>
    </section>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: "templates", element: withSuspense(<TemplatesPage />) },
      { path: "create", element: withSuspense(<CreateQuizPage />) },
      { path: "create/:templateId", element: withSuspense(<CreateQuizPage />) },
      { path: "auth", element: withSuspense(<AuthPage />) },
      { path: "join/:roomId?", element: withSuspense(<JoinPage />) },
      { path: "play/:roomId/:questionIndex", element: withSuspense(<PlayPage />) },
      { path: "results/:roomId", element: withSuspense(<ResultsPage />) },
      { path: "about", element: withSuspense(<AboutPage />) },
      { path: "privacy", element: withSuspense(<PrivacyPage />) },
      { path: "terms", element: withSuspense(<TermsPage />) },
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
