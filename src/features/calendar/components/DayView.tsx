import { format, isSameDay } from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import { useAppStore } from '../../../stores/appStore';
import { useTasks } from '../../../hooks';
import type { Task } from '../../../types';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

export function DayView() {
  const { selectedDate, openTaskModal } = useAppStore();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: tasks = [], isLoading } = useTasks(dateStr, dateStr);

  const getTasksForHour = (hour: number) => {
    return tasks.filter((task) => {
      if (!task.scheduled_time) return false;
      const taskHour = parseInt(task.scheduled_time.split(':')[0], 10);
      return taskHour === hour;
    });
  };

  const unscheduledTasks = tasks.filter((task) => !task.scheduled_time);

  const handleTimeSlotClick = (_hour: number) => {
    openTaskModal();
  };

  return (
    <div className="h-full flex flex-col bg-white/60 rounded-2xl overflow-hidden border border-white/50">
      {/* Day header */}
      <div className="px-4 py-3 bg-white/80 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {format(selectedDate, 'EEEE')}
          </h2>
          <p className="text-sm text-gray-500">{format(selectedDate, 'MMMM d, yyyy')}</p>
        </div>
        <Button size="sm" onClick={() => openTaskModal()}>
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Unscheduled tasks */}
      {unscheduledTasks.length > 0 && (
        <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Unscheduled</p>
          <div className="flex flex-wrap gap-2">
            {unscheduledTasks.map((task) => (
              <TaskChip key={task.id} task={task} onClick={() => openTaskModal(task)} />
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading...
          </div>
        ) : (
          <div className="relative">
            {HOURS.map((hour) => {
              const hourTasks = getTasksForHour(hour);
              const isCurrentHour = new Date().getHours() === hour && isSameDay(selectedDate, new Date());

              return (
                <div
                  key={hour}
                  className={cn(
                    'flex border-b border-gray-100 min-h-[60px] group',
                    isCurrentHour && 'bg-lavender-50/50'
                  )}
                >
                  {/* Time label */}
                  <div className="w-16 flex-shrink-0 px-2 py-1 text-xs text-gray-400 text-right">
                    {format(new Date().setHours(hour, 0), 'h a')}
                  </div>

                  {/* Time slot content */}
                  <div
                    className="flex-1 border-l border-gray-100 px-2 py-1 hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() => handleTimeSlotClick(hour)}
                  >
                    <div className="space-y-1">
                      {hourTasks.map((task) => (
                        <TaskBlock
                          key={task.id}
                          task={task}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskModal(task);
                          }}
                        />
                      ))}
                    </div>
                    {hourTasks.length === 0 && (
                      <div className="h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-gray-300">Click to add task</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface TaskBlockProps {
  task: Task;
  onClick: (e: React.MouseEvent) => void;
}

function TaskBlock({ task, onClick }: TaskBlockProps) {
  const priorityColors = {
    high: 'bg-coral-100 border-coral-300 text-coral-800',
    medium: 'bg-journal-100 border-journal-300 text-journal-800',
    low: 'bg-sage-100 border-sage-300 text-sage-800',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'px-2 py-1 rounded border-l-2 text-sm cursor-pointer transition-all hover:shadow-sm',
        priorityColors[task.priority],
        task.is_completed && 'opacity-50 line-through'
      )}
    >
      <div className="font-medium truncate">{task.title}</div>
      {task.scheduled_time && (
        <div className="text-xs opacity-70">
          {task.scheduled_time} - {task.duration_minutes}min
        </div>
      )}
    </div>
  );
}

interface TaskChipProps {
  task: Task;
  onClick: () => void;
}

function TaskChip({ task, onClick }: TaskChipProps) {
  const priorityColors = {
    high: 'bg-coral-100 text-coral-700',
    medium: 'bg-journal-100 text-journal-700',
    low: 'bg-sage-100 text-sage-700',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-1 rounded-full text-xs font-medium transition-all hover:shadow-sm',
        priorityColors[task.priority],
        task.is_completed && 'opacity-50 line-through'
      )}
    >
      {task.title}
    </button>
  );
}
