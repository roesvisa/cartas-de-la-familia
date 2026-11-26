import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import { ConnectedApp } from "./ui/ConnectedApp";
import { MockCollectionRepository } from "./data/mockRepository";
import "./ui/global.css";
import { ACTIVE_THEME, applyTheme } from './theme/themeConfig';
import { ThemeProvider } from './theme/ThemeProvider';
applyTheme(ACTIVE_THEME);
const params = new URLSearchParams(location.search),
  scenario = params.get("demo");
const count = params.has("packs") ? Number(params.get("packs")) : 3;
const repository = new MockCollectionRepository(
  450,
  scenario === "empty" || scenario === "error" ? scenario : "normal",
  Number.isFinite(count) ? count : 3,
);
createRoot(document.getElementById("root")!).render(
  <StrictMode><ThemeProvider>
    {import.meta.env.DEV && scenario ? <App repository={repository} /> : <ConnectedApp />}
  </ThemeProvider></StrictMode>,
);
