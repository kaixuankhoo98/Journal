import { invoke } from '@tauri-apps/api/core';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  DailyGoal,
  UpsertGoalInput,
  JournalEntry,
  UpsertEntryInput,
} from '../types';

// Task Commands
export async function getTasksForDateRange(startDate: string, endDate: string): Promise<Task[]> {
  return invoke('get_tasks_for_date_range', { startDate, endDate });
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return invoke('create_task', { input });
}

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
  return invoke('update_task', { input });
}

export async function deleteTask(id: string): Promise<void> {
  return invoke('delete_task', { id });
}

export async function toggleTaskCompletion(id: string): Promise<Task> {
  return invoke('toggle_task_completion', { id });
}

// Goal Commands
export async function getGoalsForDate(date: string): Promise<DailyGoal[]> {
  return invoke('get_goals_for_date', { date });
}

export async function upsertGoal(input: UpsertGoalInput): Promise<DailyGoal> {
  return invoke('upsert_goal', { input });
}

export async function toggleGoalCompletion(id: string): Promise<DailyGoal> {
  return invoke('toggle_goal_completion', { id });
}

export async function deleteGoal(id: string): Promise<void> {
  return invoke('delete_goal', { id });
}

// Journal Commands
export async function getEntryForDate(date: string): Promise<JournalEntry | null> {
  return invoke('get_entry_for_date', { date });
}

export async function upsertEntry(input: UpsertEntryInput): Promise<JournalEntry> {
  return invoke('upsert_entry', { input });
}

export async function deleteEntry(id: string): Promise<void> {
  return invoke('delete_entry', { id });
}
