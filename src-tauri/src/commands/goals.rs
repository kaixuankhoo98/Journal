use crate::database::{DailyGoal, Database, UpsertGoalInput};
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_goals_for_date(db: State<Database>, date: String) -> Result<Vec<DailyGoal>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, goal_date, goal_text, goal_order, is_completed
             FROM daily_goals
             WHERE goal_date = ?
             ORDER BY goal_order",
        )
        .map_err(|e| e.to_string())?;

    let goals = stmt
        .query_map(params![date], |row| {
            Ok(DailyGoal {
                id: row.get(0)?,
                goal_date: row.get(1)?,
                goal_text: row.get(2)?,
                goal_order: row.get(3)?,
                is_completed: row.get::<_, i32>(4)? != 0,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(goals)
}

#[tauri::command]
pub fn upsert_goal(db: State<Database>, input: UpsertGoalInput) -> Result<DailyGoal, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Check if goal exists for this date and order
    let existing: Option<String> = conn
        .query_row(
            "SELECT id FROM daily_goals WHERE goal_date = ? AND goal_order = ?",
            params![input.goal_date, input.goal_order],
            |row| row.get(0),
        )
        .ok();

    let id = if let Some(existing_id) = existing {
        // Update existing goal
        conn.execute(
            "UPDATE daily_goals SET goal_text = ? WHERE id = ?",
            params![input.goal_text, existing_id],
        )
        .map_err(|e| e.to_string())?;
        existing_id
    } else {
        // Create new goal
        let new_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO daily_goals (id, goal_date, goal_text, goal_order)
             VALUES (?, ?, ?, ?)",
            params![new_id, input.goal_date, input.goal_text, input.goal_order],
        )
        .map_err(|e| e.to_string())?;
        new_id
    };

    // Fetch and return the goal
    let goal = conn
        .query_row(
            "SELECT id, goal_date, goal_text, goal_order, is_completed
             FROM daily_goals WHERE id = ?",
            params![id],
            |row| {
                Ok(DailyGoal {
                    id: row.get(0)?,
                    goal_date: row.get(1)?,
                    goal_text: row.get(2)?,
                    goal_order: row.get(3)?,
                    is_completed: row.get::<_, i32>(4)? != 0,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(goal)
}

#[tauri::command]
pub fn toggle_goal_completion(db: State<Database>, id: String) -> Result<DailyGoal, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE daily_goals SET is_completed = NOT is_completed WHERE id = ?",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    let goal = conn
        .query_row(
            "SELECT id, goal_date, goal_text, goal_order, is_completed
             FROM daily_goals WHERE id = ?",
            params![id],
            |row| {
                Ok(DailyGoal {
                    id: row.get(0)?,
                    goal_date: row.get(1)?,
                    goal_text: row.get(2)?,
                    goal_order: row.get(3)?,
                    is_completed: row.get::<_, i32>(4)? != 0,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(goal)
}

#[tauri::command]
pub fn delete_goal(db: State<Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM daily_goals WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
