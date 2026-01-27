use crate::database::{Database, JournalEntry, UpsertEntryInput};
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_entry_for_date(
    db: State<Database>,
    date: String,
) -> Result<Option<JournalEntry>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let entry = conn
        .query_row(
            "SELECT id, entry_date, content, mood
             FROM journal_entries
             WHERE entry_date = ?",
            params![date],
            |row| {
                Ok(JournalEntry {
                    id: row.get(0)?,
                    entry_date: row.get(1)?,
                    content: row.get(2)?,
                    mood: row.get(3)?,
                })
            },
        )
        .ok();

    Ok(entry)
}

#[tauri::command]
pub fn upsert_entry(db: State<Database>, input: UpsertEntryInput) -> Result<JournalEntry, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Check if entry exists for this date
    let existing: Option<String> = conn
        .query_row(
            "SELECT id FROM journal_entries WHERE entry_date = ?",
            params![input.entry_date],
            |row| row.get(0),
        )
        .ok();

    let id = if let Some(existing_id) = existing {
        // Update existing entry
        conn.execute(
            "UPDATE journal_entries SET content = ?, mood = ? WHERE id = ?",
            params![input.content, input.mood, existing_id],
        )
        .map_err(|e| e.to_string())?;
        existing_id
    } else {
        // Create new entry
        let new_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO journal_entries (id, entry_date, content, mood)
             VALUES (?, ?, ?, ?)",
            params![new_id, input.entry_date, input.content, input.mood],
        )
        .map_err(|e| e.to_string())?;
        new_id
    };

    // Fetch and return the entry
    let entry = conn
        .query_row(
            "SELECT id, entry_date, content, mood
             FROM journal_entries WHERE id = ?",
            params![id],
            |row| {
                Ok(JournalEntry {
                    id: row.get(0)?,
                    entry_date: row.get(1)?,
                    content: row.get(2)?,
                    mood: row.get(3)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(entry)
}

#[tauri::command]
pub fn delete_entry(db: State<Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM journal_entries WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
