// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors
// Browser-preview only. Desktop theme source of truth is SQLite.
// This script reads the preview key and never claims to be the desktop database.
(function () {
  try {
    var raw = localStorage.getItem("toolzen.browser-preview");
    if (!raw) return;
    var data = JSON.parse(raw);
    var theme = data && data.preferences && data.preferences.theme;
    var resolved = theme;
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var root = document.documentElement;
    if (resolved === "light") root.classList.remove("dark");
    if (resolved === "dark") root.classList.add("dark");
    if (resolved === "light" || resolved === "dark") root.style.colorScheme = resolved;
  } catch (_error) {
    // Keep the dark default if the preview cache is unreadable.
  }
})();
