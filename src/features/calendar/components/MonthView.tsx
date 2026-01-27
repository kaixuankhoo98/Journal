import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { cn } from '../../../lib/utils';
import { useAppStore } from '../../../stores/appStore';
import { useTasks } from '../../../hooks';
import type { Task } from '../../../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthView() {
  const { selectedDate, setSelectedDate, setCalendarView, openTaskModal } = useAppStore();
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const startStr = format(calendarStart, 'yyyy-MM-dd');
  const endStr = format(calendarEnd, 'yyyy-MM-dd');
  const { data: tasks = [], isLoading } = useTasks(startStr, endStr);

  // Generate calendar days
  const calendarDays: Date[] = [];
  let currentDay = calendarStart;
  while (currentDay <= calendarEnd) {
    calendarDays.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }

  const getTasksForDay = (day: Date): Task[] => {
    return tasks.filter((task) => task.scheduled_date === format(day, 'yyyy-MM-dd'));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setCalendarView('day');
  };

  // Split days into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className="h-full flex flex-col bg-white/60 rounded-2xl overflow-hidden border border-white/50">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-white/80 border-b border-gray-200">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-gray-500 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-6 overflow-hidden">
        {isLoading ? (
          <div className="row-span-6 flex items-center justify-center text-gray-400">
            Loading...
          </div>
        ) : (
          weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
              {week.map((day) => {
                const dayTasks = getTasksForDay(day);
                const isCurrentMonth = isSameMonth(day, selectedDate);
                const isSelected = isSameDay(day, selectedDate);
                const today = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      'min-h-[80px] p-1 border-l border-gray-100 first:border-l-0 cursor-pointer transition-colors',
                      'hover:bg-gray-50/80',
                      !isCurrentMonth && 'bg-gray-50/50',
                      isSelected && 'bg-lavender-50',
                      today && 'ring-1 ring-inset ring-lavender-300'
                    )}
                  >
                    {/* Day number */}
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        !isCurrentMonth && 'text-gray-300',
                        today && 'text-lavender-600',
                        isSelected && !today && 'text-lavender-700'
                      )}
                    >
                      {format(day, 'd')}
                    </div>

                    {/* Task indicators */}
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map((task) => (
                        <MonthTaskDot
                          key={task.id}
                          task={task}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(day);
                            openTaskModal(task);
                          }}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-400 px-1">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface MonthTaskDotProps {
  task: Task;
  onClick: (e: React.MouseEvent) => void;
}

function MonthTaskDot({ task, onClick }: MonthTaskDotProps) {
  const priorityColors = {
    high: 'bg-coral-400',
    medium: 'bg-journal-400',
    low: 'bg-sage-400',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-1 py-0.5 rounded text-xs truncate cursor-pointer',
        'hover:bg-white/50 transition-colors',
        task.is_completed && 'opacity-50'
      )}
      title={task.title}
    >
      <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', priorityColors[task.priority])} />
      <span className={cn('truncate', task.is_completed && 'line-through')}>
        {task.title}
      </span>
    </div>
  );
}
