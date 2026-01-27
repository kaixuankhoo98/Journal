import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';
import type { CalendarView } from '../../types';

const viewIcons: Record<CalendarView, typeof Calendar> = {
  day: Calendar,
  week: CalendarDays,
  month: CalendarRange,
};

export function Header() {
  const {
    selectedDate,
    calendarView,
    setCalendarView,
    goToToday,
    goToPrevious,
    goToNext,
  } = useAppStore();

  const getDateDisplay = () => {
    switch (calendarView) {
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        return format(selectedDate, "'Week of' MMMM d, yyyy");
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center gap-4">
        {/* App title */}
        <h1 className="text-2xl font-bold bg-gradient-to-r from-lavender-600 to-coral-500 bg-clip-text text-transparent">
          Journal
        </h1>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Date display */}
        <span className="text-lg font-medium text-gray-700">{getDateDisplay()}</span>
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
        {(['day', 'week', 'month'] as CalendarView[]).map((view) => {
          const Icon = viewIcons[view];
          const isActive = calendarView === view;
          return (
            <button
              key={view}
              onClick={() => setCalendarView(view)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${isActive ? 'bg-white shadow-sm text-lavender-600' : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="capitalize">{view}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
