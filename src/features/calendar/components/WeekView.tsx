import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { cn } from '../../../lib/utils';
import { useAppStore } from '../../../stores/appStore';
import { useTasks } from '../../../hooks';
import type { Task } from '../../../types';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

export function WeekView() {
  const { selectedDate, setSelectedDate, setCalendarView, openTaskModal } = useAppStore();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  const { data: tasks = [], isLoading } = useTasks(startStr, endStr);

  const getTasksForDayAndHour = (day: Date, hour: number) => {
    return tasks.filter((task) => {
      if (task.scheduled_date !== format(day, 'yyyy-MM-dd')) return false;
      if (!task.scheduled_time) return false;
      const taskHour = parseInt(task.scheduled_time.split(':')[0], 10);
      return taskHour === hour;
    });
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setCalendarView('day');
  };

  return (
    <div className="h-full flex flex-col bg-white/60 rounded-2xl overflow-hidden border border-white/50">
      {/* Week header */}
      <div className="flex border-b border-gray-200 bg-white/80">
        {/* Time column spacer */}
        <div className="w-16 flex-shrink-0" />

        {/* Day headers */}
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            onClick={() => handleDayClick(day)}
            className={cn(
              'flex-1 text-center py-2 cursor-pointer hover:bg-gray-50 transition-colors border-l border-gray-100',
              isToday(day) && 'bg-lavender-50'
            )}
          >
            <div className="text-xs text-gray-500 uppercase">{format(day, 'EEE')}</div>
            <div
              className={cn(
                'text-lg font-semibold',
                isToday(day) ? 'text-lavender-600' : 'text-gray-900',
                isSameDay(day, selectedDate) && 'underline'
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading...
          </div>
        ) : (
          <div className="relative">
            {HOURS.map((hour) => (
              <div key={hour} className="flex border-b border-gray-100 min-h-[48px]">
                {/* Time label */}
                <div className="w-16 flex-shrink-0 px-2 py-1 text-xs text-gray-400 text-right">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>

                {/* Day columns */}
                {weekDays.map((day) => {
                  const dayTasks = getTasksForDayAndHour(day, hour);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        'flex-1 border-l border-gray-100 px-0.5 py-0.5 hover:bg-gray-50/50 cursor-pointer transition-colors',
                        isToday(day) && 'bg-lavender-50/30'
                      )}
                    >
                      {dayTasks.map((task) => (
                        <WeekTaskBlock
                          key={task.id}
                          task={task}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(day);
                            openTaskModal(task);
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface WeekTaskBlockProps {
  task: Task;
  onClick: (e: React.MouseEvent) => void;
}

function WeekTaskBlock({ task, onClick }: WeekTaskBlockProps) {
  const priorityColors = {
    high: 'bg-coral-200 border-coral-400',
    medium: 'bg-journal-200 border-journal-400',
    low: 'bg-sage-200 border-sage-400',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'px-1 py-0.5 text-xs truncate rounded border-l-2 mb-0.5 cursor-pointer',
        priorityColors[task.priority],
        task.is_completed && 'opacity-50 line-through'
      )}
      title={task.title}
    >
      {task.title}
    </div>
  );
}
