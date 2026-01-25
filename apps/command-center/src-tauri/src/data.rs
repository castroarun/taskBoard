//! Data layer for reading/writing JSON files
//!
//! Handles all file operations for projects, tasks, and inbox.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::State;
use std::sync::Mutex;
use crate::AppState;

/// Get the data directory path
fn get_data_dir(state: &State<'_, Mutex<AppState>>) -> PathBuf {
    state.lock().unwrap().data_dir.clone()
}

/// Get the path to a data file
#[tauri::command]
pub fn get_data_path(filename: &str, state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let path = get_data_dir(&state).join(filename);
    Ok(path.to_string_lossy().to_string())
}

/// Read projects.json
#[tauri::command]
pub fn read_projects(state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let path = get_data_dir(&state).join("projects.json");

    if !path.exists() {
        // Return empty projects structure
        return Ok(r#"{"version":"1.0.0","lastUpdated":"","projects":[]}"#.to_string());
    }

    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read projects.json: {}", e))
}

/// Write projects.json
#[tauri::command]
pub fn write_projects(data: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let path = get_data_dir(&state).join("projects.json");

    fs::write(&path, data)
        .map_err(|e| format!("Failed to write projects.json: {}", e))
}

/// Read tasks.json
#[tauri::command]
pub fn read_tasks(state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let path = get_data_dir(&state).join("tasks.json");

    if !path.exists() {
        return Ok(r#"{"version":"1.0.0","lastUpdated":"","tasks":[]}"#.to_string());
    }

    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read tasks.json: {}", e))
}

/// Write tasks.json
#[tauri::command]
pub fn write_tasks(data: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let path = get_data_dir(&state).join("tasks.json");

    fs::write(&path, data)
        .map_err(|e| format!("Failed to write tasks.json: {}", e))
}

/// Read inbox.md (for Claude readability)
#[tauri::command]
pub fn read_inbox(state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let path = get_data_dir(&state).join("inbox.md");

    if !path.exists() {
        return Ok("# Inbox\n\nQuick instructions for agents. Write here anytime.\n\n---\n".to_string());
    }

    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read inbox.md: {}", e))
}

/// Write inbox.md (for Claude readability)
#[tauri::command]
pub fn write_inbox(data: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let path = get_data_dir(&state).join("inbox.md");

    fs::write(&path, data)
        .map_err(|e| format!("Failed to write inbox.md: {}", e))
}

/// Read inbox.json (structured data)
#[tauri::command]
pub fn read_inbox_json(state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let path = get_data_dir(&state).join("inbox.json");

    if !path.exists() {
        return Ok(r#"{"version":"1.0.0","lastUpdated":"","items":[]}"#.to_string());
    }

    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read inbox.json: {}", e))
}

/// Write inbox.json (structured data)
#[tauri::command]
pub fn write_inbox_json(data: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let path = get_data_dir(&state).join("inbox.json");

    fs::write(&path, data)
        .map_err(|e| format!("Failed to write inbox.json: {}", e))
}

/// Read any markdown document
#[tauri::command]
pub fn read_document(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);

    if !path.exists() {
        return Err(format!("Document not found: {:?}", path));
    }

    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read document: {}", e))
}

/// Write any markdown document
#[tauri::command]
pub fn write_document(path: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(path);

    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    fs::write(&path, content)
        .map_err(|e| format!("Failed to write document: {}", e))
}
