// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

mod commands;
pub mod db;
pub mod error;
pub mod execution;

use std::fs;
use std::sync::Mutex;

use tauri::Manager;

use crate::db::Database;

pub struct AppState {
    pub database: Mutex<Database>,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| -> Result<(), Box<dyn std::error::Error>> {
            let dir = app.path().app_data_dir()?;
            fs::create_dir_all(&dir)?;
            let database = Database::open(&dir.join("toolzen.sqlite"))?;
            app.manage(AppState { database: Mutex::new(database) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::load_state, commands::apply_op, commands::storage_info])
        .run(tauri::generate_context!())
        .expect("ToolZen failed to start");
}
