mod commands;
mod database;
mod notifications;

use database::Database;
use notifications::start_notification_scheduler;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            // Task commands
            commands::get_tasks_for_date_range,
            commands::create_task,
            commands::update_task,
            commands::delete_task,
            commands::toggle_task_completion,
            // Goal commands
            commands::get_goals_for_date,
            commands::upsert_goal,
            commands::toggle_goal_completion,
            commands::delete_goal,
            // Journal commands
            commands::get_entry_for_date,
            commands::upsert_entry,
            commands::delete_entry,
        ])
        .setup(|app| {
            // Start the notification scheduler
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(async {
                    start_notification_scheduler(handle);
                    // Keep the runtime alive
                    loop {
                        tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;
                    }
                });
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
