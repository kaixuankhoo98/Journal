import { create } from 'zustand';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { CalendarView, Task } from '../types';

interface AppState {
  // Calendar state
  selectedDate: Date;
  calendarView: CalendarView;

  // Modal state
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  initialTime: string | null;

  // Actions
  setSelectedDate: (date: Date) => void;
  setCalendarView: (view: CalendarView) => void;
  openTaskModal: (task?: Task, time?: string) => void;
  closeTaskModal: () => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;

  // Helpers
  getDateRange: () => { start: string; end: string };
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedDate: new Date(),
  calendarView: 'day',
  isTaskModalOpen: false,
  editingTask: null,
  initialTime: null,

  setSelectedDate: (date) => set({ selectedDate: date }),

  setCalendarView: (view) => set({ calendarView: view }),

  openTaskModal: (task, time) => set({
    isTaskModalOpen: true,
    editingTask: task || null,
    initialTime: time || null,
  }),

  closeTaskModal: () => set({ isTaskModalOpen: false, editingTask: null, initialTime: null }),

  goToToday: () => set({ selectedDate: new Date() }),

  goToPrevious: () => {
    const { selectedDate, calendarView } = get();
    let newDate = new Date(selectedDate);

    switch (calendarView) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    set({ selectedDate: newDate });
  },

  goToNext: () => {
    const { selectedDate, calendarView } = get();
    let newDate = new Date(selectedDate);

    switch (calendarView) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    set({ selectedDate: newDate });
  },

  getDateRange: () => {
    const { selectedDate, calendarView } = get();

    switch (calendarView) {
      case 'day':
        const dayStr = format(selectedDate, 'yyyy-MM-dd');
        return { start: dayStr, end: dayStr };
      case 'week':
        return {
          start: format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        };
      case 'month':
        return {
          start: format(startOfMonth(selectedDate), 'yyyy-MM-dd'),
          end: format(endOfMonth(selectedDate), 'yyyy-MM-dd'),
        };
    }
  },
}));
