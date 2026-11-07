// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

use tauri::State;

use crate::db::{PersistedState, PersistenceOp, StorageInfo};
use crate::AppState;

fn with_db<T>(state: &AppState, body: impl FnOnce(&crate::db::Database) -> Result<T, crate::error::AppError>) -> Result<T, String> {
    let database = state.database.lock().map_err(|_| "The local database lock was poisoned.".to_string())?;
    body(&database).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_state(state: State<'_, AppState>) -> Result<PersistedState, String> {
    with_db(&state, |database| database.load_state())
}

#[tauri::command]
pub fn apply_op(state: State<'_, AppState>, operation: PersistenceOp) -> Result<PersistedState, String> {
    with_db(&state, |database| database.apply(operation))
}

#[tauri::command]
pub fn storage_info(state: State<'_, AppState>) -> Result<StorageInfo, String> {
    with_db(&state, |database| database.info())
}
