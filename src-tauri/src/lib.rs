// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

mod commands;
pub mod db;
pub mod engines;
pub mod error;
pub mod execution;
pub mod output;

use std::fs;
use std::sync::Mutex;

use tauri::Manager;

use crate::db::Database;

pub struct AppState {
    pub database: Mutex<Database>,
}

fn runtime_window_icon() -> Option<tauri::image::Image<'static>> {
    // Tauri's Image::from_bytes needs the image-png feature, which pulls the `image` crate.
    // That crate is not in this lockfile. `png` 0.18 is already used by the Tauri stack, so the window icon is decoded with it.
    let decoder = png::Decoder::new(std::io::Cursor::new(
        include_bytes!("../icons/runtime/icon-32.png").as_slice(),
    ));
    let mut reader = decoder.read_info().ok()?;
    let mut buffer = vec![0; reader.output_buffer_size()?];
    let frame = reader.next_frame(&mut buffer).ok()?;
    let bytes = buffer[..frame.buffer_size()].to_vec();
    Some(tauri::image::Image::new_owned(
        bytes,
        frame.width,
        frame.height,
    ))
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| -> Result<(), Box<dyn std::error::Error>> {
            let dir = app.path().app_data_dir()?;
            fs::create_dir_all(&dir)?;
            let database = Database::open(&dir.join("toolzen.sqlite"))?;
            app.manage(AppState {
                database: Mutex::new(database),
            });
            if let Some(window) = app.get_webview_window("main") {
                if let Some(icon) = runtime_window_icon() {
                    // Window/taskbar icon only. The installer and dock bundle keep icons/ listed in tauri.conf.json.
                    let _ = window.set_icon(icon);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::load_state,
            commands::apply_op,
            commands::storage_info,
            commands::run_engine,
            commands::save_output
        ])
        .run(tauri::generate_context!())
        .expect("ToolZen failed to start");
}
