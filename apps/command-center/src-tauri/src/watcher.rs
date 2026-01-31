//! File watcher for inbox.json
//!
//! Watches ~/.taskboard/inbox.json for changes and sends Windows
//! desktop notifications when new inbox items appear.

use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use tauri_plugin_notification::NotificationExt;

/// Minimal inbox structures for detecting new items
#[derive(Deserialize, Debug)]
struct InboxData {
    items: Vec<InboxItem>,
}

#[derive(Deserialize, Debug, Clone)]
struct InboxItem {
    id: String,
    text: String,
    #[serde(default)]
    author: String,
    #[serde(default)]
    read: bool,
    #[serde(default)]
    replies: Vec<InboxReply>,
}

#[derive(Deserialize, Debug, Clone)]
struct InboxReply {
    id: String,
    author: String,
    text: String,
}

/// Track the last known state of inbox to detect changes
struct WatcherState {
    last_item_count: usize,
    last_item_ids: Vec<String>,
}

/// Start watching inbox.json for new items
pub fn start_inbox_watcher(app_handle: AppHandle) {
    let home = dirs::home_dir().expect("Could not find home directory");
    let inbox_path = home.join(".taskboard").join("inbox.json");

    // Initialize state from current file
    let initial_state = read_inbox_state(&inbox_path);
    let state = Arc::new(Mutex::new(WatcherState {
        last_item_count: initial_state.0,
        last_item_ids: initial_state.1,
    }));

    let watch_path = home.join(".taskboard");
    let inbox_file = inbox_path.clone();
    let state_clone = Arc::clone(&state);

    // Spawn watcher on a background thread
    std::thread::spawn(move || {
        let (tx, rx) = std::sync::mpsc::channel::<Result<Event, notify::Error>>();

        let mut watcher = RecommendedWatcher::new(tx, Config::default())
            .expect("Failed to create file watcher");

        watcher
            .watch(&watch_path, RecursiveMode::NonRecursive)
            .expect("Failed to watch .taskboard directory");

        // Keep watcher alive and process events
        for event in rx {
            if let Ok(event) = event {
                // Only react to modify/create events on inbox.json
                let is_inbox_event = event.paths.iter().any(|p| {
                    p.file_name()
                        .map(|name| name == "inbox.json")
                        .unwrap_or(false)
                });

                if !is_inbox_event {
                    continue;
                }

                match event.kind {
                    EventKind::Modify(_) | EventKind::Create(_) => {
                        check_and_notify(
                            &inbox_file,
                            &state_clone,
                            &app_handle,
                        );
                    }
                    _ => {}
                }
            }
        }
    });
}

/// Read inbox.json and return (item_count, item_ids)
fn read_inbox_state(path: &PathBuf) -> (usize, Vec<String>) {
    if !path.exists() {
        return (0, vec![]);
    }

    match fs::read_to_string(path) {
        Ok(content) => match serde_json::from_str::<InboxData>(&content) {
            Ok(data) => {
                let ids: Vec<String> = data.items.iter().map(|i| i.id.clone()).collect();
                (data.items.len(), ids)
            }
            Err(_) => (0, vec![]),
        },
        Err(_) => (0, vec![]),
    }
}

/// Compare current inbox state with last known state and notify if new items found
fn check_and_notify(
    inbox_path: &PathBuf,
    state: &Arc<Mutex<WatcherState>>,
    app_handle: &AppHandle,
) {
    let (current_count, current_ids) = read_inbox_state(inbox_path);

    let mut watcher_state = match state.lock() {
        Ok(s) => s,
        Err(_) => return,
    };

    // Find new item IDs
    let new_ids: Vec<String> = current_ids
        .iter()
        .filter(|id| !watcher_state.last_item_ids.contains(id))
        .cloned()
        .collect();

    if new_ids.is_empty() {
        // Also check for new replies on existing items
        if let Some(new_reply_info) = check_for_new_replies(inbox_path) {
            send_notification(
                app_handle,
                "New reply in inbox",
                &new_reply_info,
            );
        }

        // Update state even if no new items (ids might have been removed)
        watcher_state.last_item_count = current_count;
        watcher_state.last_item_ids = current_ids;
        return;
    }

    // Get the text of new items for the notification body
    let notification_body = get_new_items_summary(inbox_path, &new_ids);

    send_notification(
        app_handle,
        &format!(
            "{} new inbox item{}",
            new_ids.len(),
            if new_ids.len() > 1 { "s" } else { "" }
        ),
        &notification_body,
    );

    // Also emit an event to the frontend so the UI can update
    let _ = app_handle.emit("inbox-updated", current_count);

    // Update state
    watcher_state.last_item_count = current_count;
    watcher_state.last_item_ids = current_ids;
}

/// Check if any existing items got new replies (e.g., Claude responded)
fn check_for_new_replies(inbox_path: &PathBuf) -> Option<String> {
    if !inbox_path.exists() {
        return None;
    }

    let content = fs::read_to_string(inbox_path).ok()?;
    let data: InboxData = serde_json::from_str(&content).ok()?;

    // Find items with unread Claude replies
    for item in &data.items {
        if !item.read {
            for reply in &item.replies {
                if reply.author == "claude" {
                    return Some(format!("Claude replied: {}", truncate(&reply.text, 80)));
                }
            }
        }
    }

    None
}

/// Build a summary of new items for the notification body
fn get_new_items_summary(inbox_path: &PathBuf, new_ids: &[String]) -> String {
    if !inbox_path.exists() {
        return String::from("New items in your inbox");
    }

    let content = match fs::read_to_string(inbox_path) {
        Ok(c) => c,
        Err(_) => return String::from("New items in your inbox"),
    };

    let data: InboxData = match serde_json::from_str(&content) {
        Ok(d) => d,
        Err(_) => return String::from("New items in your inbox"),
    };

    let new_items: Vec<&InboxItem> = data
        .items
        .iter()
        .filter(|item| new_ids.contains(&item.id))
        .collect();

    if new_items.is_empty() {
        return String::from("New items in your inbox");
    }

    if new_items.len() == 1 {
        return truncate(&new_items[0].text, 120);
    }

    // Multiple items — show first two
    let first = truncate(&new_items[0].text, 60);
    let second = truncate(&new_items[1].text, 60);
    if new_items.len() == 2 {
        format!("• {}\n• {}", first, second)
    } else {
        format!(
            "• {}\n• {}\n+{} more",
            first,
            second,
            new_items.len() - 2
        )
    }
}

/// Send a Windows toast notification
fn send_notification(app_handle: &AppHandle, title: &str, body: &str) {
    let _ = app_handle
        .notification()
        .builder()
        .title(title)
        .body(body)
        .show();
}

/// Truncate a string to max_len, adding "..." if truncated
fn truncate(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len.min(s.len())])
    }
}
