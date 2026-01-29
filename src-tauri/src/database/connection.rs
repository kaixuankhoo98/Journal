use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = Self::get_db_path();

        // Ensure the parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(&db_path)?;
        let db = Self {
            conn: Mutex::new(conn),
        };

        db.run_migrations()?;
        Ok(db)
    }

    fn get_db_path() -> PathBuf {
        let data_dir = dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("Journal");

        std::fs::create_dir_all(&data_dir).ok();
        data_dir.join("journal.db")
    }

    fn run_migrations(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // Create tasks table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                scheduled_date TEXT NOT NULL,
                scheduled_time TEXT,
                duration_minutes INTEGER DEFAULT 30,
                priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
                is_completed INTEGER DEFAULT 0,
                reminder_minutes INTEGER,
                color TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Migration: Add color column if it doesn't exist
        conn.execute(
            "ALTER TABLE tasks ADD COLUMN color TEXT",
            [],
        ).ok(); // Ignore error if column already exists

        // Create daily_goals table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS daily_goals (
                id TEXT PRIMARY KEY,
                goal_date TEXT NOT NULL,
                goal_text TEXT NOT NULL,
                goal_order INTEGER NOT NULL,
                is_completed INTEGER DEFAULT 0,
                UNIQUE(goal_date, goal_order)
            )",
            [],
        )?;

        // Create journal_entries table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS journal_entries (
                id TEXT PRIMARY KEY,
                entry_date TEXT NOT NULL UNIQUE,
                content TEXT NOT NULL,
                mood TEXT
            )",
            [],
        )?;

        // Create index for faster date-based queries
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(scheduled_date)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_goals_date ON daily_goals(goal_date)",
            [],
        )?;

        Ok(())
    }
}
