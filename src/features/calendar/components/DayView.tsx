import { format, isSameDay } from 'date-fns';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import { useAppStore } from '../../../stores/appStore';
import { useTasks } from '../../../hooks';
import type { Task } from '../../../types';
import { useDragState, isSlotInDropRange, isSlotInResizeRange } from './CalendarDndContext';
import type { DragData, DropData } from './CalendarDndContext';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm
const QUARTER_HOURS = [0, 15, 30, 45];
const SLOT_HEIGHT = 24; // pixels per 15-minute slot
const HOUR_HEIGHT = SLOT_HEIGHT * 4; // 96px per hour
const START_HOUR = 6;

export function DayView() {
  const { selectedDate, openTaskModal } = useAppStore();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: tasks = [], isLoading } = useTasks(dateStr, dateStr);

  const scheduledTasks = tasks.filter((task) => task.scheduled_time);
  const unscheduledTasks = tasks.filter((task) => !task.scheduled_time);

  const handleTimeSlotClick = (hour: number, minutes: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    openTaskModal(undefined, timeStr);
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
      <UnscheduledSection
        tasks={unscheduledTasks}
        dateStr={dateStr}
        onTaskClick={(task) => openTaskModal(task)}
      />

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading...
          </div>
        ) : (
          <div className="relative">
            {/* Hour rows with drop zones */}
            {HOURS.map((hour) => {
              const isCurrentHour = new Date().getHours() === hour && isSameDay(selectedDate, new Date());

              return (
                <TimeSlotRow
                  key={hour}
                  hour={hour}
                  dateStr={dateStr}
                  isCurrentHour={isCurrentHour}
                  onSlotClick={handleTimeSlotClick}
                />
              );
            })}

            {/* Task overlay layer - tasks positioned absolutely */}
            <div className="absolute inset-0 ml-16 border-l border-transparent pointer-events-none">
              {scheduledTasks.map((task) => (
                <PositionedTask
                  key={task.id}
                  task={task}
                  onClick={() => openTaskModal(task)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface UnscheduledSectionProps {
  tasks: Task[];
  dateStr: string;
  onTaskClick: (task: Task) => void;
}

function UnscheduledSection({ tasks, dateStr, onTaskClick }: UnscheduledSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `unscheduled-${dateStr}`,
    data: {
      type: 'unscheduled',
      date: dateStr,
    } as DropData,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'px-4 py-2 border-b border-gray-100 min-h-[40px] transition-colors',
        isOver ? 'bg-lavender-100/50 ring-2 ring-lavender-300 ring-inset' : 'bg-gray-50/50'
      )}
    >
      <p className="text-xs text-gray-500 mb-2">Unscheduled</p>
      {tasks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tasks.map((task) => (
            <DraggableTaskChip key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-300">Drag tasks here to unschedule</p>
      )}
    </div>
  );
}

interface TimeSlotRowProps {
  hour: number;
  dateStr: string;
  isCurrentHour: boolean;
  onSlotClick: (hour: number, minutes: number) => void;
}

function TimeSlotRow({ hour, dateStr, isCurrentHour, onSlotClick }: TimeSlotRowProps) {
  return (
    <div
      className={cn(
        'flex border-b border-gray-100',
        isCurrentHour && 'bg-lavender-50/50'
      )}
    >
      {/* Time label - positioned at the top of the hour row */}
      <div
        className="w-16 flex-shrink-0 relative text-xs text-gray-400 text-right pr-2"
        style={{ height: HOUR_HEIGHT }}
      >
        <span className="absolute top-1 right-2">
          {format(new Date().setHours(hour, 0), 'h a')}
        </span>
      </div>

      {/* Quarter-hour drop zones */}
      <div className="flex-1 border-l border-gray-100">
        {QUARTER_HOURS.map((minutes, index) => (
          <QuarterHourDropZone
            key={`${hour}-${minutes}`}
            hour={hour}
            minutes={minutes}
            dateStr={dateStr}
            isFirstSlot={index === 0}
            onSlotClick={() => onSlotClick(hour, minutes)}
          />
        ))}
      </div>
    </div>
  );
}

interface QuarterHourDropZoneProps {
  hour: number;
  minutes: number;
  dateStr: string;
  isFirstSlot: boolean;
  onSlotClick: () => void;
}

function QuarterHourDropZone({ hour, minutes, dateStr, isFirstSlot, onSlotClick }: QuarterHourDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id: `day-slot-${dateStr}-${hour}-${minutes}`,
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
      className={cn(
        'px-2 cursor-pointer transition-colors',
        !isFirstSlot && 'border-t border-gray-100',
        isInDropRange && 'bg-lavender-100/70',
        isInResizeRange && 'bg-sage-100/70'
      )}
      style={{ height: SLOT_HEIGHT }}
      onClick={onSlotClick}
    />
  );
}

interface PositionedTaskProps {
  task: Task;
  onClick: () => void;
}

function PositionedTask({ task, onClick }: PositionedTaskProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
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

  const topOffset = ((hour - START_HOUR) * 60 + minutes) * (SLOT_HEIGHT / 15) + 2;
  
  // Calculate height - use hover slot during resize drag for real-time feedback
  let height = Math.max(task.duration_minutes * (SLOT_HEIGHT / 15), SLOT_HEIGHT);
  if (dragState.activeTask?.id === task.id && dragState.dragType === 'resize' && dragState.hoverSlot) {
    const taskStartMinutes = hour * 60 + minutes;
    const hoverEndMinutes = dragState.hoverSlot.hour * 60 + dragState.hoverSlot.minutes + 15;
    const newDuration = Math.max(15, hoverEndMinutes - taskStartMinutes);
    height = Math.max(newDuration * (SLOT_HEIGHT / 15), SLOT_HEIGHT);
  }

  const priorityColors = {
    high: 'bg-coral-100 border-coral-300 text-coral-800',
    medium: 'bg-journal-100 border-journal-300 text-journal-800',
    low: 'bg-sage-100 border-sage-300 text-sage-800',
  };

  const customColorStyle = task.color
    ? { borderLeftColor: task.color, backgroundColor: `${task.color}20` }
    : undefined;

  return (
    <div
      className={cn(
        'absolute left-0 right-1 rounded border-l-2 text-sm transition-all hover:shadow-md hover:z-10 pointer-events-auto group',
        !task.color && priorityColors[task.priority],
        task.is_completed && 'opacity-50 line-through',
        isDragging && 'opacity-30 z-50'
      )}
      style={{
        top: topOffset,
        height,
        ...customColorStyle,
      }}
    >
      {/* Main task content - draggable for moving */}
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          'px-2 cursor-grab touch-none h-full flex flex-col justify-center overflow-hidden',
          height >= 25 ? 'py-1' : 'py-0.5'
        )}
        style={{ height: height - 6 }} // Leave room for resize handle
      >
        <div className="font-medium truncate leading-tight text-xs">{task.title}</div>
        {height >= 40 && task.scheduled_time && (
          <div className="text-xs opacity-70 leading-tight mt-0.5">
            {task.scheduled_time} - {task.duration_minutes}min
          </div>
        )}
      </div>

      {/* Resize handle at bottom */}
      <ResizeHandle task={task} />
    </div>
  );
}

interface ResizeHandleProps {
  task: Task;
}

function ResizeHandle({ task }: ResizeHandleProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resize-${task.id}`,
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
        'absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity touch-none',
        'bg-gradient-to-t from-gray-400/30 to-transparent hover:from-gray-500/50',
        isDragging && 'opacity-100'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Visual indicator */}
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gray-400 rounded-full" />
    </div>
  );
}

interface DraggableTaskChipProps {
  task: Task;
  onClick: () => void;
}

function DraggableTaskChip({ task, onClick }: DraggableTaskChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-chip-${task.id}`,
    data: {
      type: 'task',
      task,
    } as DragData,
  });

  const priorityColors = {
    high: 'bg-coral-100 text-coral-700',
    medium: 'bg-journal-100 text-journal-700',
    low: 'bg-sage-100 text-sage-700',
  };

  const customColorStyle = task.color
    ? { backgroundColor: `${task.color}30` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'px-2 py-1 rounded-full text-xs font-medium transition-all hover:shadow-sm cursor-grab touch-none',
        !task.color && priorityColors[task.priority],
        task.is_completed && 'opacity-50 line-through',
        isDragging && 'opacity-30'
      )}
      style={customColorStyle}
    >
      {task.title}
    </button>
  );
}
