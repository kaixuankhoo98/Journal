import { useAppStore } from '../../../stores/appStore';
import { CalendarDndContext } from './CalendarDndContext';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';

export function CalendarContainer() {
  const { calendarView } = useAppStore();

  const renderView = () => {
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
  };

  return <CalendarDndContext>{renderView()}</CalendarDndContext>;
}
