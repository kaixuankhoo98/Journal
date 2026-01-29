import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { cn } from '../../../lib/utils';
import { useAppStore } from '../../../stores/appStore';
import { useTasks } from '../../../hooks';
import type { Task } from '../../../types';
import { useDragState, isSlotInDropRange, isSlotInResizeRange } from './CalendarDndContext';
import type { DragData, DropData } from './CalendarDndContext';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm
const QUARTER_HOURS = [0, 15, 30, 45];
const SLOT_HEIGHT = 18; // pixels per 15-minute slot
const HOUR_HEIGHT = SLOT_HEIGHT * 4; // 72px per hour
const START_HOUR = 6;

export function WeekView() {
  const { selectedDate, setSelectedDate, openTaskModal } = useAppStore();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  const { data: tasks = [], isLoading } = useTasks(startStr, endStr);

  const getTasksForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return tasks.filter((task) => task.scheduled_date === dayStr && task.scheduled_time);
  };

  const handleDayClick = (day: Date, hour?: number, minutes?: number) => {
    setSelectedDate(day);
    if (hour !== undefined) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${(minutes ?? 0).toString().padStart(2, '0')}`;
      openTaskModal(undefined, timeStr);
    } else {
      openTaskModal();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/60 rounded-2xl overflow-hidden border border-white/50">
      {/* Scrollable container for both header and grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading...
          </div>
        ) : (
          <div className="relative">
            {/* Sticky week header */}
            <div className="sticky top-0 z-20 flex border-b border-gray-200 bg-white/95 backdrop-blur-sm">
              {/* Time column spacer */}
              <div className="w-16 flex-shrink-0" />

              {/* Day headers */}
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'flex-1 text-center py-2 cursor-pointer hover:bg-gray-50/80 transition-colors border-l border-gray-100',
                    isToday(day) && 'bg-lavender-50/90'
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
            <div className="relative flex">
              {/* Time labels column */}
              <div className="w-16 flex-shrink-0">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="relative text-xs text-gray-400 text-right pr-2 border-b border-gray-100"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className="absolute top-1 right-2">
                      {format(new Date().setHours(hour, 0), 'h a')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns with drop zones and tasks */}
              {weekDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayTasks = getTasksForDay(day);

                return (
                  <WeekDayColumn
                    key={day.toISOString()}
                    day={day}
                    dateStr={dayStr}
                    tasks={dayTasks}
                    onClick={(hour, minutes) => handleDayClick(day, hour, minutes)}
                    onTaskClick={(task) => {
                      setSelectedDate(day);
                      openTaskModal(task);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface WeekDayColumnProps {
  day: Date;
  dateStr: string;
  tasks: Task[];
  onClick: (hour: number, minutes: number) => void;
  onTaskClick: (task: Task) => void;
}

function WeekDayColumn({ day, dateStr, tasks, onClick, onTaskClick }: WeekDayColumnProps) {
  return (
    <div
      className={cn(
        'flex-1 border-l border-gray-100 relative',
        isToday(day) && 'bg-lavender-50/30'
      )}
    >
      {/* Drop zones */}
      {HOURS.map((hour) => (
        <div key={hour} className="border-b border-gray-100" style={{ height: HOUR_HEIGHT }}>
          {QUARTER_HOURS.map((minutes, minIndex) => (
            <WeekQuarterDropZone
              key={`${dateStr}-${hour}-${minutes}`}
              dateStr={dateStr}
              hour={hour}
              minutes={minutes}
              isFirstSlot={minIndex === 0}
              onClick={() => onClick(hour, minutes)}
            />
          ))}
        </div>
      ))}

      {/* Task overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {tasks.map((task) => (
          <PositionedWeekTask
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </div>
  );
}

interface WeekQuarterDropZoneProps {
  dateStr: string;
  hour: number;
  minutes: number;
  isFirstSlot: boolean;
  onClick: () => void;
}

function WeekQuarterDropZone({ dateStr, hour, minutes, isFirstSlot, onClick }: WeekQuarterDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id: `week-slot-${dateStr}-${hour}-${minutes}`,
    data: {
      type: 'time-slot',
      hour,
      minutes,
      date: dateStr,
    } as DropData,
  });

  const dragState = useDragState();
  const isInDropRange = isSlotInDropRange(dateStr, hour, minutes, dragState);
  const isInResizeRange = isSlotInResizeRange(dateStr, hour, minutes, dragState);

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-colors',
        !isFirstSlot && 'border-t border-gray-50',
        isInDropRange && 'bg-lavender-100/70',
        isInResizeRange && 'bg-sage-100/70'
      )}
      style={{ height: SLOT_HEIGHT }}
    />
  );
}

interface PositionedWeekTaskProps {
  task: Task;
  onClick: () => void;
}

function PositionedWeekTask({ task, onClick }: PositionedWeekTaskProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `week-task-${task.id}`,
    data: {
      type: 'task',
      task,
    } as DragData,
  });

  const dragState = useDragState();

  // Calculate position based on time
  const [hourStr, minStr] = (task.scheduled_time || '00:00').split(':');
  const hour = parseInt(hourStr, 10);
  const minutes = parseInt(minStr, 10);

  const topOffset = ((hour - START_HOUR) * 60 + minutes) * (SLOT_HEIGHT / 15);
  
  // Calculate height - use hover slot during resize drag for real-time feedback
  let height = Math.max(task.duration_minutes * (SLOT_HEIGHT / 15), SLOT_HEIGHT);
  if (dragState.activeTask?.id === task.id && dragState.dragType === 'resize' && dragState.hoverSlot) {
    const taskStartMinutes = hour * 60 + minutes;
    const hoverEndMinutes = dragState.hoverSlot.hour * 60 + dragState.hoverSlot.minutes + 15;
    const newDuration = Math.max(15, hoverEndMinutes - taskStartMinutes);
    height = Math.max(newDuration * (SLOT_HEIGHT / 15), SLOT_HEIGHT);
  }

  const priorityColors = {
    high: 'bg-coral-200 border-coral-400',
    medium: 'bg-journal-200 border-journal-400',
    low: 'bg-sage-200 border-sage-400',
  };

  const customColorStyle = task.color
    ? { borderLeftColor: task.color, backgroundColor: `${task.color}30` }
    : undefined;

  return (
    <div
      className={cn(
        'absolute left-0 right-0 text-xs rounded border-l-2 pointer-events-auto group',
        !task.color && priorityColors[task.priority],
        task.is_completed && 'opacity-50 line-through',
        isDragging && 'opacity-30 z-50'
      )}
      style={{
        top: topOffset,
        height,
        ...customColorStyle,
      }}
      title={`${task.title} (${task.scheduled_time} - ${task.duration_minutes}min)`}
    >
      {/* Main content - draggable */}
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          'cursor-grab touch-none flex flex-col justify-center overflow-hidden',
          height >= 20 ? 'px-1 py-0.5' : 'px-1 py-0'
        )}
        style={{ height: Math.max(height - 4, 8) }}
      >
        <div className="truncate font-medium leading-tight">{task.title}</div>
        {height >= 28 && (
          <div className="truncate opacity-70 leading-tight text-[10px] mt-0.5">{task.scheduled_time}</div>
        )}
      </div>

      {/* Resize handle */}
      <WeekResizeHandle task={task} />
    </div>
  );
}

interface WeekResizeHandleProps {
  task: Task;
}

function WeekResizeHandle({ task }: WeekResizeHandleProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `week-resize-${task.id}`,
    data: {
      type: 'resize',
      task,
    } as DragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity touch-none',
        'bg-gradient-to-t from-gray-400/40 to-transparent',
        isDragging && 'opacity-100'
      )}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
