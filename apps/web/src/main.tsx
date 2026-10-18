// SPDX-License-Identifier: AGPL-3.0-only
import { createRoot } from "react-dom/client";
import "@fontsource-variable/plus-jakarta-sans";
import "./tokens.css";
import "./style.css";
import { App } from "./App";
createRoot(document.getElementById("root")!).render(<App />);
