-- SPDX-License-Identifier: Apache-2.0
-- Copyright 2026 ToolZen Contributors

CREATE TABLE preferences (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  theme TEXT NOT NULL,
  language TEXT NOT NULL,
  startup_page TEXT NOT NULL,
  execution_mode TEXT NOT NULL,
  last_route_json TEXT,
  ai_retention_opt_in INTEGER NOT NULL,
  ai_retention_days INTEGER
);

INSERT INTO preferences (id, theme, language, startup_page, execution_mode, last_route_json, ai_retention_opt_in, ai_retention_days)
VALUES (1, 'light', 'en', 'home', 'local', NULL, 0, NULL);

CREATE TABLE favorites (
  tool_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE recent_tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL,
  opened_at TEXT NOT NULL
);

CREATE TABLE tool_usage (
  tool_id TEXT PRIMARY KEY,
  open_count INTEGER NOT NULL,
  last_opened_at TEXT NOT NULL
);
