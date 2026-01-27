use crate::database::{Database, Task};
use chrono::{Local, NaiveTime};
use rusqlite::params;
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;
use tokio::time::{interval, Duration};

pub fn start_notification_scheduler(app: AppHandle) {
    let app_handle = Arc::new(app);

    tokio::spawn(async move {
        let mut check_interval = interval(Duration::from_secs(60)); // Check every minute

        loop {
            check_interval.tick().await;
            check_and_send_notifications(&app_handle);
        }
    });
}

fn check_and_send_notifications(app: &AppHandle) {
    let db = match app.try_state::<Database>() {
        Some(db) => db,
        None => return,
    };

    let now = Local::now();
    let today = now.format("%Y-%m-%d").to_string();
    let current_time = now.format("%H:%M").to_string();

    let conn = match db.conn.lock() {
        Ok(c) => c,
        Err(_) => return,
    };

    // Find tasks with reminders that should fire now
    let mut stmt = match conn.prepare(
        "SELECT id, title, scheduled_time, reminder_minutes
         FROM tasks
         WHERE scheduled_date = ?
           AND scheduled_time IS NOT NULL
           AND reminder_minutes IS NOT NULL
           AND is_completed = 0",
    ) {
        Ok(s) => s,
        Err(_) => return,
    };

    let tasks: Vec<(String, String, String, i32)> = stmt
        .query_map(params![today], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i32>(3)?,
            ))
        })
        .ok()
        .map(|iter| iter.filter_map(|r| r.ok()).collect())
        .unwrap_or_default();

    for (id, title, scheduled_time, reminder_minutes) in tasks {
        if should_notify(&current_time, &scheduled_time, reminder_minutes) {
            send_task_notification(app, &title, &scheduled_time);

            // Mark notification as sent by clearing reminder (simple approach)
            let _ = conn.execute(
                "UPDATE tasks SET reminder_minutes = NULL WHERE id = ?",
                params![id],
            );
        }
    }
}

fn should_notify(current_time: &str, scheduled_time: &str, reminder_minutes: i32) -> bool {
    let current = match NaiveTime::parse_from_str(current_time, "%H:%M") {
        Ok(t) => t,
        Err(_) => return false,
    };

    let scheduled = match NaiveTime::parse_from_str(scheduled_time, "%H:%M") {
        Ok(t) => t,
        Err(_) => return false,
    };

    let reminder_time = scheduled - chrono::Duration::minutes(reminder_minutes as i64);

    // Check if current time is within the reminder minute
    let diff = (current - reminder_time).num_minutes().abs();
    diff == 0
}

fn send_task_notification(app: &AppHandle, title: &str, scheduled_time: &str) {
    let _ = app
        .notification()
        .builder()
        .title("Task Reminder")
        .body(format!("{} at {}", title, scheduled_time))
        .show();
}
