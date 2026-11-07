// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

use std::path::{Path, PathBuf};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::{AppError, AppResult};

const MIGRATIONS: &[(i64, &str)] = &[
    (1, include_str!("../migrations/001_initial.sql")),
    (
        2,
        include_str!("../migrations/002_workflows_ai_permissions.sql"),
    ),
];

const CATEGORIES: &[&str] = &[
    "pdf",
    "images",
    "text",
    "developer-tools",
    "file-utilities",
    "converters",
    "productivity",
];
const MAX_WORKFLOW_CHARS: usize = 256 * 1024;
const MAX_MESSAGE_CHARS: usize = 16 * 1024;

pub struct Database {
    conn: Connection,
    path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Preferences {
    pub theme: String,
    pub language: String,
    pub startup_page: String,
    pub execution_mode: String,
    pub last_route: Option<Value>,
    pub ai_retention_opt_in: bool,
    pub ai_retention_days: Option<u32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentEntry {
    pub tool_id: String,
    pub opened_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageEntry {
    pub tool_id: String,
    pub open_count: i64,
    pub last_opened_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiConversation {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub retention_opt_in: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiMessage {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedState {
    pub schema_version: i64,
    pub preferences: Preferences,
    pub favorites: Vec<String>,
    pub recent: Vec<RecentEntry>,
    pub usage: Vec<UsageEntry>,
    pub workflows: Vec<Value>,
    pub workflow_executions: Vec<Value>,
    pub ai_conversations: Vec<AiConversation>,
    pub ai_messages: Vec<AiMessage>,
    pub permission_grants: Vec<Value>,
    pub permission_audit: Vec<Value>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageInfo {
    pub backend: &'static str,
    pub path: String,
    pub schema_version: i64,
    pub favorite_count: i64,
    pub recent_count: i64,
    pub workflow_count: i64,
    pub ai_conversation_count: i64,
    pub grant_count: i64,
    pub note: &'static str,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum PersistenceOp {
    SetPreferences { preferences: Preferences },
    SetFavorite { tool_id: String, favorite: bool },
    RecordToolOpen { tool_id: String, opened_at: String },
    ClearHistory,
    ClearFavorites,
    ResetPreferences,
    ResetAllLocalData,
    UpsertWorkflow { record: Value },
    DeleteWorkflow { id: String },
    AppendWorkflowExecution { record: Value },
    UpsertAiConversation { record: Value },
    AppendAiMessage { message: Value },
    DeleteAiConversation { id: String },
    InsertGrant { grant: Value },
    RevokeGrant { id: String, revoked_at: String },
    AppendAudit { event: Value },
}

impl Database {
    pub fn open(path: &Path) -> AppResult<Self> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        conn.pragma_update(None, "busy_timeout", 2000)?;
        migrate(&conn)?;
        Ok(Self {
            conn,
            path: path.to_path_buf(),
        })
    }

    pub fn load_state(&self) -> AppResult<PersistedState> {
        Ok(PersistedState {
            schema_version: schema_version(&self.conn)?,
            preferences: load_preferences(&self.conn)?,
            favorites: load_favorites(&self.conn)?,
            recent: load_recent(&self.conn)?,
            usage: load_usage(&self.conn)?,
            workflows: load_json_column(
                &self.conn,
                "SELECT definition_json FROM workflows ORDER BY updated_at DESC",
            )?,
            workflow_executions: load_json_column(
                &self.conn,
                "SELECT record_json FROM workflow_executions ORDER BY started_at DESC",
            )?,
            ai_conversations: load_conversations(&self.conn)?,
            ai_messages: load_messages(&self.conn)?,
            permission_grants: load_json_column(
                &self.conn,
                "SELECT grant_json FROM permission_grants ORDER BY granted_at ASC",
            )?,
            permission_audit: load_json_column(
                &self.conn,
                "SELECT event_json FROM permission_audit ORDER BY occurred_at ASC",
            )?,
        })
    }

    pub fn info(&self) -> AppResult<StorageInfo> {
        Ok(StorageInfo {
            backend: "sqlite",
            path: self.path.display().to_string(),
            schema_version: schema_version(&self.conn)?,
            favorite_count: count(&self.conn, "favorites")?,
            recent_count: count(&self.conn, "recent_tools")?,
            workflow_count: count(&self.conn, "workflows")?,
            ai_conversation_count: count(&self.conn, "ai_conversations")?,
            grant_count: count(&self.conn, "permission_grants")?,
            note: "SQLite file in the app data directory. It is not the browser preview store.",
        })
    }

    pub fn apply(&self, operation: PersistenceOp) -> AppResult<PersistedState> {
        match operation {
            PersistenceOp::SetPreferences { preferences } => {
                validate_preferences(&preferences)?;
                save_preferences(&self.conn, &preferences)?;
            }
            PersistenceOp::SetFavorite { tool_id, favorite } => {
                require_id(&tool_id)?;
                if favorite {
                    self.conn.execute("INSERT OR IGNORE INTO favorites (tool_id, created_at) VALUES (?1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))", params![tool_id])?;
                } else {
                    self.conn
                        .execute("DELETE FROM favorites WHERE tool_id = ?1", params![tool_id])?;
                }
            }
            PersistenceOp::RecordToolOpen { tool_id, opened_at } => {
                require_id(&tool_id)?;
                if opened_at.len() > 40 || !opened_at.contains('T') {
                    return Err(AppError::Message("Invalid timestamp.".into()));
                }
                self.conn.execute(
                    "INSERT INTO recent_tools (tool_id, opened_at) VALUES (?1, ?2)",
                    params![tool_id, opened_at],
                )?;
                self.conn.execute("DELETE FROM recent_tools WHERE id NOT IN (SELECT id FROM recent_tools ORDER BY opened_at DESC LIMIT 200)", [])?;
                self.conn.execute(
                    "INSERT INTO tool_usage (tool_id, open_count, last_opened_at) VALUES (?1, 1, ?2) ON CONFLICT(tool_id) DO UPDATE SET open_count = open_count + 1, last_opened_at = excluded.last_opened_at",
                    params![tool_id, opened_at],
                )?;
            }
            PersistenceOp::ClearHistory => {
                self.conn.execute("DELETE FROM recent_tools", [])?;
                self.conn.execute("DELETE FROM tool_usage", [])?;
            }
            PersistenceOp::ClearFavorites => {
                self.conn.execute("DELETE FROM favorites", [])?;
            }
            PersistenceOp::ResetPreferences => {
                save_preferences(&self.conn, &default_preferences())?
            }
            PersistenceOp::ResetAllLocalData => reset_all(&self.conn)?,
            PersistenceOp::UpsertWorkflow { record } => upsert_workflow(&self.conn, &record)?,
            PersistenceOp::DeleteWorkflow { id } => {
                require_id(&id)?;
                self.conn.execute(
                    "DELETE FROM workflow_executions WHERE workflow_id = ?1",
                    params![id],
                )?;
                self.conn
                    .execute("DELETE FROM workflows WHERE id = ?1", params![id])?;
            }
            PersistenceOp::AppendWorkflowExecution { record } => {
                append_execution(&self.conn, &record)?
            }
            PersistenceOp::UpsertAiConversation { record } => {
                upsert_conversation(&self.conn, &record)?
            }
            PersistenceOp::AppendAiMessage { message } => append_message(&self.conn, &message)?,
            PersistenceOp::DeleteAiConversation { id } => {
                require_text_id(&id)?;
                self.conn.execute(
                    "DELETE FROM ai_messages WHERE conversation_id = ?1",
                    params![id],
                )?;
                self.conn
                    .execute("DELETE FROM ai_conversations WHERE id = ?1", params![id])?;
            }
            PersistenceOp::InsertGrant { grant } => {
                let id = require_json_id(&grant)?;
                let text = bounded_json(&grant, 32 * 1024)?;
                self.conn.execute(
                    "INSERT INTO permission_grants (id, grant_json, granted_at, revoked_at) VALUES (?1, ?2, strftime('%Y-%m-%dT%H:%M:%fZ','now'), NULL)",
                    params![id, text],
                )?;
            }
            PersistenceOp::RevokeGrant { id, revoked_at } => {
                require_text_id(&id)?;
                let mut grant: Value = self
                    .conn
                    .query_row(
                        "SELECT grant_json FROM permission_grants WHERE id = ?1",
                        params![id],
                        |row| {
                            let text: String = row.get(0)?;
                            Ok(text)
                        },
                    )
                    .optional()?
                    .map(|text| serde_json::from_str(&text))
                    .transpose()?
                    .ok_or_else(|| AppError::Message("Grant not found.".into()))?;
                if let Some(object) = grant.as_object_mut() {
                    object.insert("revokedAt".into(), Value::String(revoked_at));
                }
                self.conn.execute(
                    "UPDATE permission_grants SET grant_json = ?2, revoked_at = ?3 WHERE id = ?1",
                    params![
                        id,
                        grant.to_string(),
                        grant["revokedAt"].as_str().unwrap_or("")
                    ],
                )?;
            }
            PersistenceOp::AppendAudit { event } => {
                let id = require_json_id(&event)?;
                let text = bounded_json(&event, 16 * 1024)?;
                self.conn.execute(
                    "INSERT INTO permission_audit (id, event_json, occurred_at) VALUES (?1, ?2, strftime('%Y-%m-%dT%H:%M:%fZ','now'))",
                    params![id, text],
                )?;
                self.conn.execute("DELETE FROM permission_audit WHERE id NOT IN (SELECT id FROM permission_audit ORDER BY occurred_at DESC LIMIT 500)", [])?;
            }
        }
        self.load_state()
    }
}

pub fn valid_identifier(value: &str) -> bool {
    let bytes = value.as_bytes();
    if bytes.is_empty() || bytes.len() > 64 {
        return false;
    }
    let ok = |byte: u8| byte.is_ascii_lowercase() || byte.is_ascii_digit();
    ok(bytes[0])
        && ok(bytes[bytes.len() - 1])
        && bytes.iter().all(|byte| ok(*byte) || *byte == b'-')
}

fn migrate(conn: &Connection) -> AppResult<()> {
    conn.execute_batch("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);")?;
    let current = schema_version(conn)?;
    for (version, sql) in MIGRATIONS {
        if *version > current {
            let tx = conn.unchecked_transaction()?;
            tx.execute_batch(sql)?;
            tx.execute("INSERT INTO schema_migrations (version, applied_at) VALUES (?1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))", params![version])?;
            tx.commit()?;
        }
    }
    Ok(())
}

fn schema_version(conn: &Connection) -> AppResult<i64> {
    let exists: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
        [],
        |row| row.get(0),
    )?;
    if exists == 0 {
        return Ok(0);
    }
    Ok(conn.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
        [],
        |row| row.get(0),
    )?)
}

fn default_preferences() -> Preferences {
    Preferences {
        theme: "dark".into(),
        language: "en".into(),
        startup_page: "home".into(),
        execution_mode: "local".into(),
        last_route: None,
        ai_retention_opt_in: false,
        ai_retention_days: None,
    }
}

fn validate_preferences(preferences: &Preferences) -> AppResult<()> {
    if !matches!(preferences.theme.as_str(), "dark" | "light" | "system") {
        return Err(AppError::Message("Invalid theme.".into()));
    }
    if preferences.language != "en" && preferences.language != "es" {
        return Err(AppError::Message(
            "Only English and Spanish are implemented.".into(),
        ));
    }
    if !matches!(
        preferences.startup_page.as_str(),
        "home" | "tools" | "last-tool"
    ) {
        return Err(AppError::Message("Invalid startup page.".into()));
    }
    if preferences.execution_mode == "cloud" {
        return Err(AppError::Message(
            "Cloud mode cannot be stored. No cloud provider exists.".into(),
        ));
    }
    if !matches!(preferences.execution_mode.as_str(), "local" | "auto") {
        return Err(AppError::Message("Invalid execution mode.".into()));
    }
    if let Some(days) = preferences.ai_retention_days {
        if !(1..=3650).contains(&days) {
            return Err(AppError::Message("Retention days are out of range.".into()));
        }
    }
    if let Some(route) = &preferences.last_route {
        validate_route(route)?;
    }
    Ok(())
}

fn validate_route(route: &Value) -> AppResult<()> {
    let name = route
        .get("name")
        .and_then(Value::as_str)
        .ok_or_else(|| AppError::Message("Invalid route.".into()))?;
    match name {
        "home" | "tools" | "favorites" | "recent" | "settings" | "about" => Ok(()),
        "tool" => {
            let id = route.get("toolId").and_then(Value::as_str).unwrap_or("");
            require_id(id)
        }
        "category" => {
            let category = route.get("category").and_then(Value::as_str).unwrap_or("");
            if CATEGORIES.contains(&category) {
                Ok(())
            } else {
                Err(AppError::Message("Invalid category.".into()))
            }
        }
        _ => Err(AppError::Message("Invalid route.".into())),
    }
}

fn save_preferences(conn: &Connection, preferences: &Preferences) -> AppResult<()> {
    let route = preferences
        .last_route
        .as_ref()
        .map(serde_json::to_string)
        .transpose()?;
    conn.execute(
        "UPDATE preferences SET theme=?1, language=?2, startup_page=?3, execution_mode=?4, last_route_json=?5, ai_retention_opt_in=?6, ai_retention_days=?7 WHERE id=1",
        params![
            preferences.theme,
            preferences.language,
            preferences.startup_page,
            preferences.execution_mode,
            route,
            if preferences.ai_retention_opt_in { 1 } else { 0 },
            preferences.ai_retention_days,
        ],
    )?;
    Ok(())
}

fn load_preferences(conn: &Connection) -> AppResult<Preferences> {
    conn.query_row(
        "SELECT theme, language, startup_page, execution_mode, last_route_json, ai_retention_opt_in, ai_retention_days FROM preferences WHERE id = 1",
        [],
        |row| {
            let route: Option<String> = row.get(4)?;
            let parsed = route.map(|text| serde_json::from_str(&text)).transpose().map_err(|error| rusqlite::Error::ToSqlConversionFailure(Box::new(error)))?;
            Ok(Preferences {
                theme: row.get(0)?,
                language: row.get(1)?,
                startup_page: row.get(2)?,
                execution_mode: row.get(3)?,
                last_route: parsed,
                ai_retention_opt_in: row.get::<_, i64>(5)? != 0,
                ai_retention_days: row.get(6)?,
            })
        },
    ).map_err(AppError::from)
}

fn load_favorites(conn: &Connection) -> AppResult<Vec<String>> {
    let mut statement = conn.prepare("SELECT tool_id FROM favorites ORDER BY created_at ASC")?;
    let rows = statement.query_map([], |row| row.get(0))?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

fn load_recent(conn: &Connection) -> AppResult<Vec<RecentEntry>> {
    let mut statement = conn
        .prepare("SELECT tool_id, opened_at FROM recent_tools ORDER BY opened_at DESC LIMIT 200")?;
    let rows = statement.query_map([], |row| {
        Ok(RecentEntry {
            tool_id: row.get(0)?,
            opened_at: row.get(1)?,
        })
    })?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

fn load_usage(conn: &Connection) -> AppResult<Vec<UsageEntry>> {
    let mut statement =
        conn.prepare("SELECT tool_id, open_count, last_opened_at FROM tool_usage")?;
    let rows = statement.query_map([], |row| {
        Ok(UsageEntry {
            tool_id: row.get(0)?,
            open_count: row.get(1)?,
            last_opened_at: row.get(2)?,
        })
    })?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

fn load_json_column(conn: &Connection, sql: &str) -> AppResult<Vec<Value>> {
    let mut statement = conn.prepare(sql)?;
    let rows = statement.query_map([], |row| row.get::<_, String>(0))?;
    let mut values = Vec::new();
    for row in rows {
        values.push(serde_json::from_str(&row?)?);
    }
    Ok(values)
}

fn load_conversations(conn: &Connection) -> AppResult<Vec<AiConversation>> {
    let mut statement = conn.prepare("SELECT id, title, created_at, updated_at, retention_opt_in FROM ai_conversations ORDER BY updated_at DESC")?;
    let rows = statement.query_map([], |row| {
        Ok(AiConversation {
            id: row.get(0)?,
            title: row.get(1)?,
            created_at: row.get(2)?,
            updated_at: row.get(3)?,
            retention_opt_in: row.get::<_, i64>(4)? != 0,
        })
    })?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

fn load_messages(conn: &Connection) -> AppResult<Vec<AiMessage>> {
    let mut statement = conn.prepare("SELECT id, conversation_id, role, content, created_at FROM ai_messages ORDER BY created_at ASC")?;
    let rows = statement.query_map([], |row| {
        Ok(AiMessage {
            id: row.get(0)?,
            conversation_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

fn count(conn: &Connection, table: &str) -> AppResult<i64> {
    let sql = format!("SELECT COUNT(*) FROM {table}");
    Ok(conn.query_row(&sql, [], |row| row.get(0))?)
}

fn reset_all(conn: &Connection) -> AppResult<()> {
    conn.execute_batch(
        "DELETE FROM ai_messages; DELETE FROM ai_conversations; DELETE FROM workflow_executions; DELETE FROM workflows; DELETE FROM permission_audit; DELETE FROM permission_grants; DELETE FROM recent_tools; DELETE FROM tool_usage; DELETE FROM favorites;",
    )?;
    save_preferences(conn, &default_preferences())
}

fn upsert_workflow(conn: &Connection, record: &Value) -> AppResult<()> {
    let text = bounded_json(record, MAX_WORKFLOW_CHARS)?;
    let id = record
        .pointer("/metadata/id")
        .and_then(Value::as_str)
        .ok_or_else(|| AppError::Message("Workflow id is missing.".into()))?;
    require_id(id)?;
    conn.execute(
        "INSERT INTO workflows (id, definition_json, updated_at) VALUES (?1, ?2, strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(id) DO UPDATE SET definition_json = excluded.definition_json, updated_at = excluded.updated_at",
        params![id, text],
    )?;
    Ok(())
}

fn append_execution(conn: &Connection, record: &Value) -> AppResult<()> {
    let text = bounded_json(record, 64 * 1024)?;
    if let Some(nodes) = record.get("nodeResults").and_then(Value::as_array) {
        for node in nodes {
            if node.get("input").is_some() || node.get("output").is_some() {
                return Err(AppError::Message(
                    "Workflow history cannot store input or output contents.".into(),
                ));
            }
        }
    }
    let id = require_json_id(record)?;
    let workflow_id = record
        .get("workflowId")
        .and_then(Value::as_str)
        .unwrap_or("");
    require_id(workflow_id)?;
    let started = record
        .get("startedAt")
        .and_then(Value::as_str)
        .unwrap_or("");
    conn.execute(
        "INSERT INTO workflow_executions (id, workflow_id, record_json, started_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, workflow_id, text, started],
    )?;
    Ok(())
}

fn upsert_conversation(conn: &Connection, record: &Value) -> AppResult<()> {
    let id = require_json_id(record)?;
    let title = record
        .get("title")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    if title.len() > 200 {
        return Err(AppError::Message("Conversation title is too long.".into()));
    }
    let created = record
        .get("createdAt")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let updated = record
        .get("updatedAt")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let retention = record
        .get("retentionOptIn")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    conn.execute(
        "INSERT INTO ai_conversations (id, title, created_at, updated_at, retention_opt_in) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(id) DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at, retention_opt_in = excluded.retention_opt_in",
        params![id, title, created, updated, if retention { 1 } else { 0 }],
    )?;
    Ok(())
}

fn append_message(conn: &Connection, message: &Value) -> AppResult<()> {
    let preferences = load_preferences(conn)?;
    if !preferences.ai_retention_opt_in {
        return Err(AppError::Message(
            "AI message storage is off. Nothing was saved.".into(),
        ));
    }
    let conversation_id = message
        .get("conversationId")
        .and_then(Value::as_str)
        .unwrap_or("");
    let retention: Option<i64> = conn
        .query_row(
            "SELECT retention_opt_in FROM ai_conversations WHERE id = ?1",
            params![conversation_id],
            |row| row.get(0),
        )
        .optional()?;
    if retention != Some(1) {
        return Err(AppError::Message(
            "This conversation is not opted in to retention.".into(),
        ));
    }
    let content = message.get("content").and_then(Value::as_str).unwrap_or("");
    if content.len() > MAX_MESSAGE_CHARS {
        return Err(AppError::Message("AI message is too large.".into()));
    }
    let id = require_json_id(message)?;
    let role = message.get("role").and_then(Value::as_str).unwrap_or("");
    let created = message
        .get("createdAt")
        .and_then(Value::as_str)
        .unwrap_or("");
    conn.execute(
        "INSERT INTO ai_messages (id, conversation_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, conversation_id, role, content, created],
    )?;
    Ok(())
}

fn require_id(value: &str) -> AppResult<()> {
    if valid_identifier(value) {
        Ok(())
    } else {
        Err(AppError::Message("Invalid identifier.".into()))
    }
}

fn require_text_id(value: &str) -> AppResult<()> {
    if value.len() > 80 || value.is_empty() || value.contains('\0') {
        Err(AppError::Message("Invalid id.".into()))
    } else {
        Ok(())
    }
}

fn require_json_id(value: &Value) -> AppResult<String> {
    let id = value.get("id").and_then(Value::as_str).unwrap_or("");
    require_text_id(id)?;
    Ok(id.to_string())
}

fn bounded_json(value: &Value, max_chars: usize) -> AppResult<String> {
    let text = serde_json::to_string(value)?;
    if text.len() > max_chars {
        return Err(AppError::Message(
            "Stored JSON exceeds the size limit.".into(),
        ));
    }
    Ok(text)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    static COUNTER: AtomicU64 = AtomicU64::new(0);

    fn temp_db() -> Database {
        let n = COUNTER.fetch_add(1, Ordering::Relaxed);
        let path =
            std::env::temp_dir().join(format!("toolzen-db-{}-{n}.sqlite", std::process::id()));
        let _ = std::fs::remove_file(&path);
        Database::open(&path).expect("open db")
    }

    #[test]
    fn migrations_are_versioned_and_idempotent() {
        let db = temp_db();
        assert_eq!(schema_version(&db.conn).unwrap(), 2);
        migrate(&db.conn).unwrap();
        assert_eq!(schema_version(&db.conn).unwrap(), 2);
        let prefs = db.load_state().unwrap().preferences;
        assert_eq!(prefs.theme, "dark");
        assert!(!prefs.ai_retention_opt_in);
    }

    #[test]
    fn cloud_preference_is_rejected() {
        let db = temp_db();
        let mut preferences = default_preferences();
        preferences.execution_mode = "cloud".into();
        let error = db
            .apply(PersistenceOp::SetPreferences { preferences })
            .unwrap_err();
        assert!(error.to_string().contains("Cloud mode"));
    }

    #[test]
    fn ai_messages_require_retention_opt_in() {
        let db = temp_db();
        let conversation = serde_json::json!({
            "id": "conv-1",
            "title": "Empty",
            "createdAt": "2026-11-07T00:00:00Z",
            "updatedAt": "2026-11-07T00:00:00Z",
            "retentionOptIn": true
        });
        db.apply(PersistenceOp::UpsertAiConversation {
            record: conversation,
        })
        .unwrap();
        let message = serde_json::json!({
            "id": "msg-1",
            "conversationId": "conv-1",
            "role": "user",
            "content": "hello",
            "createdAt": "2026-11-07T00:00:01Z"
        });
        assert!(db
            .apply(PersistenceOp::AppendAiMessage {
                message: message.clone()
            })
            .is_err());
        let mut preferences = default_preferences();
        preferences.ai_retention_opt_in = true;
        db.apply(PersistenceOp::SetPreferences { preferences })
            .unwrap();
        let state = db
            .apply(PersistenceOp::AppendAiMessage { message })
            .unwrap();
        assert_eq!(state.ai_messages.len(), 1);
        assert_eq!(state.ai_messages[0].content, "hello");
    }

    #[test]
    fn workflow_history_rejects_payloads() {
        let db = temp_db();
        let record = serde_json::json!({
            "id": "run-1",
            "workflowId": "format-json",
            "version": 1,
            "startedAt": "2026-11-07T00:00:00Z",
            "finishedAt": "2026-11-07T00:00:01Z",
            "status": "succeeded",
            "nodeResults": [{ "nodeId": "format", "output": "secret" }],
            "errorCode": null
        });
        let error = db
            .apply(PersistenceOp::AppendWorkflowExecution { record })
            .unwrap_err();
        assert!(error.to_string().contains("input or output"));
    }
}
