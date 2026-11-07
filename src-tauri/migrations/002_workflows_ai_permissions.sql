-- SPDX-License-Identifier: Apache-2.0
-- Copyright 2026 ToolZen Contributors

CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  definition_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  record_json TEXT NOT NULL,
  started_at TEXT NOT NULL
);

CREATE TABLE ai_conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  retention_opt_in INTEGER NOT NULL
);

CREATE TABLE ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations (id) ON DELETE CASCADE
);

CREATE TABLE permission_grants (
  id TEXT PRIMARY KEY,
  grant_json TEXT NOT NULL,
  granted_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE permission_audit (
  id TEXT PRIMARY KEY,
  event_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);
