// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "@/styles/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element is missing.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
