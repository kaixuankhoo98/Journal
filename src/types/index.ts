export interface Task {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time?: string;
  duration_minutes: number;
  priority: 'high' | 'medium' | 'low';
  is_completed: boolean;
  reminder_minutes?: number;
  color?: string;
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time?: string;
  duration_minutes?: number;
  priority?: 'high' | 'medium' | 'low';
  reminder_minutes?: number;
  color?: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  priority?: 'high' | 'medium' | 'low';
  is_completed?: boolean;
  reminder_minutes?: number;
  color?: string;
  clear_scheduled_time?: boolean;
}

export interface DailyGoal {
  id: string;
  goal_date: string;
  goal_text: string;
  goal_order: number;
  is_completed: boolean;
}

export interface UpsertGoalInput {
  goal_date: string;
  goal_text: string;
  goal_order: number;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  content: string;
  mood?: string;
}

export interface UpsertEntryInput {
  entry_date: string;
  content: string;
  mood?: string;
}

export type CalendarView = 'day' | 'week' | 'month';

export type Mood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: 'great', label: 'Great', emoji: '😄' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'bad', label: 'Bad', emoji: '😔' },
  { value: 'terrible', label: 'Terrible', emoji: '😢' },
];

export const PRIORITIES: { value: Task['priority']; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'coral' },
  { value: 'medium', label: 'Medium', color: 'journal' },
  { value: 'low', label: 'Low', color: 'sage' },
];
