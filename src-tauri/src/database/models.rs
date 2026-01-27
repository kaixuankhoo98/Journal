use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub scheduled_date: String,
    pub scheduled_time: Option<String>,
    pub duration_minutes: i32,
    pub priority: String,
    pub is_completed: bool,
    pub reminder_minutes: Option<i32>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskInput {
    pub title: String,
    pub description: Option<String>,
    pub scheduled_date: String,
    pub scheduled_time: Option<String>,
    pub duration_minutes: Option<i32>,
    pub priority: Option<String>,
    pub reminder_minutes: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskInput {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub scheduled_date: Option<String>,
    pub scheduled_time: Option<String>,
    pub duration_minutes: Option<i32>,
    pub priority: Option<String>,
    pub is_completed: Option<bool>,
    pub reminder_minutes: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DailyGoal {
    pub id: String,
    pub goal_date: String,
    pub goal_text: String,
    pub goal_order: i32,
    pub is_completed: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpsertGoalInput {
    pub goal_date: String,
    pub goal_text: String,
    pub goal_order: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JournalEntry {
    pub id: String,
    pub entry_date: String,
    pub content: String,
    pub mood: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpsertEntryInput {
    pub entry_date: String,
    pub content: String,
    pub mood: Option<String>,
}
