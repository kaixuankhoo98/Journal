import { useAppStore } from '../../../stores/appStore';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';

export function CalendarContainer() {
  const { calendarView } = useAppStore();

  switch (calendarView) {
    case 'day':
      return <DayView />;
    case 'week':
      return <WeekView />;
    case 'month':
      return <MonthView />;
    default:
      return <DayView />;
  }
}
