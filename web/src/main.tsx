import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { hideSplash } from "./ui/splash";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Wait for the next frame so the first frame of the app is painted before the splash fades.
// hideSplash() reads document, performance.now() and prefers-reduced-motion by itself.
requestAnimationFrame(() => hideSplash());
