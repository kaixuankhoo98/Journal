use crate::database::{CreateTaskInput, Database, Task, UpdateTaskInput};
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_tasks_for_date_range(
    db: State<Database>,
    start_date: String,
    end_date: String,
) -> Result<Vec<Task>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, title, description, scheduled_date, scheduled_time,
                    duration_minutes, priority, is_completed, reminder_minutes, created_at
             FROM tasks
             WHERE scheduled_date >= ? AND scheduled_date <= ?
             ORDER BY scheduled_date, scheduled_time",
        )
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map(params![start_date, end_date], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                scheduled_date: row.get(3)?,
                scheduled_time: row.get(4)?,
                duration_minutes: row.get(5)?,
                priority: row.get(6)?,
                is_completed: row.get::<_, i32>(7)? != 0,
                reminder_minutes: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks)
}

#[tauri::command]
pub fn create_task(db: State<Database>, input: CreateTaskInput) -> Result<Task, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let duration = input.duration_minutes.unwrap_or(30);
    let priority = input.priority.unwrap_or_else(|| "medium".to_string());

    conn.execute(
        "INSERT INTO tasks (id, title, description, scheduled_date, scheduled_time,
                           duration_minutes, priority, reminder_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            id,
            input.title,
            input.description,
            input.scheduled_date,
            input.scheduled_time,
            duration,
            priority,
            input.reminder_minutes,
        ],
    )
    .map_err(|e| e.to_string())?;

    // Fetch and return the created task
    let task = conn
        .query_row(
            "SELECT id, title, description, scheduled_date, scheduled_time,
                    duration_minutes, priority, is_completed, reminder_minutes, created_at
             FROM tasks WHERE id = ?",
            params![id],
            |row| {
                Ok(Task {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    scheduled_date: row.get(3)?,
                    scheduled_time: row.get(4)?,
                    duration_minutes: row.get(5)?,
                    priority: row.get(6)?,
                    is_completed: row.get::<_, i32>(7)? != 0,
                    reminder_minutes: row.get(8)?,
                    created_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(task)
}

#[tauri::command]
pub fn update_task(db: State<Database>, input: UpdateTaskInput) -> Result<Task, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Build update query dynamically based on provided fields
    let mut updates = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref title) = input.title {
        updates.push("title = ?");
        values.push(Box::new(title.clone()));
    }
    if let Some(ref description) = input.description {
        updates.push("description = ?");
        values.push(Box::new(description.clone()));
    }
    if let Some(ref scheduled_date) = input.scheduled_date {
        updates.push("scheduled_date = ?");
        values.push(Box::new(scheduled_date.clone()));
    }
    if let Some(ref scheduled_time) = input.scheduled_time {
        updates.push("scheduled_time = ?");
        values.push(Box::new(scheduled_time.clone()));
    }
    if let Some(duration) = input.duration_minutes {
        updates.push("duration_minutes = ?");
        values.push(Box::new(duration));
    }
    if let Some(ref priority) = input.priority {
        updates.push("priority = ?");
        values.push(Box::new(priority.clone()));
    }
    if let Some(is_completed) = input.is_completed {
        updates.push("is_completed = ?");
        values.push(Box::new(if is_completed { 1 } else { 0 }));
    }
    if let Some(reminder) = input.reminder_minutes {
        updates.push("reminder_minutes = ?");
        values.push(Box::new(reminder));
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    let query = format!("UPDATE tasks SET {} WHERE id = ?", updates.join(", "));
    values.push(Box::new(input.id.clone()));

    let params: Vec<&dyn rusqlite::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    conn.execute(&query, params.as_slice())
        .map_err(|e| e.to_string())?;

    // Fetch and return the updated task
    let task = conn
        .query_row(
            "SELECT id, title, description, scheduled_date, scheduled_time,
                    duration_minutes, priority, is_completed, reminder_minutes, created_at
             FROM tasks WHERE id = ?",
            params![input.id],
            |row| {
                Ok(Task {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    scheduled_date: row.get(3)?,
                    scheduled_time: row.get(4)?,
                    duration_minutes: row.get(5)?,
                    priority: row.get(6)?,
                    is_completed: row.get::<_, i32>(7)? != 0,
                    reminder_minutes: row.get(8)?,
                    created_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(task)
}

#[tauri::command]
pub fn delete_task(db: State<Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM tasks WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn toggle_task_completion(db: State<Database>, id: String) -> Result<Task, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE tasks SET is_completed = NOT is_completed WHERE id = ?",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    let task = conn
        .query_row(
            "SELECT id, title, description, scheduled_date, scheduled_time,
                    duration_minutes, priority, is_completed, reminder_minutes, created_at
             FROM tasks WHERE id = ?",
            params![id],
            |row| {
                Ok(Task {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    scheduled_date: row.get(3)?,
                    scheduled_time: row.get(4)?,
                    duration_minutes: row.get(5)?,
                    priority: row.get(6)?,
                    is_completed: row.get::<_, i32>(7)? != 0,
                    reminder_minutes: row.get(8)?,
                    created_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(task)
}
