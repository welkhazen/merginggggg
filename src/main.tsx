import { createRoot } from "react-dom/client";
import { PostHogErrorBoundary, PostHogProvider } from "@posthog/react";
import App from "./App.tsx";
import "./index.css";
import { isPostHogEnabled, posthog } from "@/lib/analytics";
import { installGlobalErrorReporting } from "@/lib/errorReporting";

installGlobalErrorReporting();

const app = isPostHogEnabled ? (
  <PostHogProvider client={posthog}>
    <PostHogErrorBoundary>
      <App />
    </PostHogErrorBoundary>
  </PostHogProvider>
) : (
  <App />
);

createRoot(document.getElementById("root")!).render(app);
