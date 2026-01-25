// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod voice;
mod data;

use std::sync::Mutex;
use tauri::Manager;

// Application state
pub struct AppState {
    pub data_dir: std::path::PathBuf,
}

fn main() {
    // Initialize data directory
    let home = dirs::home_dir().expect("Could not find home directory");
    let data_dir = home.join(".taskboard");

    // Create data directory if it doesn't exist
    if !data_dir.exists() {
        std::fs::create_dir_all(&data_dir).expect("Could not create data directory");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(Mutex::new(AppState { data_dir }))
        .invoke_handler(tauri::generate_handler![
            // Voice commands
            voice::check_voice_available,
            voice::voice_capture,
            voice::setup_voice,
            // Data commands
            data::read_projects,
            data::write_projects,
            data::read_tasks,
            data::write_tasks,
            data::read_inbox,
            data::write_inbox,
            data::read_inbox_json,
            data::write_inbox_json,
            data::read_document,
            data::write_document,
            data::get_data_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
