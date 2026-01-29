import { createContext, useContext, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { cn } from '../../../lib/utils';
import { useUpdateTask } from '../../../hooks';
import type { Task } from '../../../types';

interface CalendarDndContextProps {
  children: React.ReactNode;
}

export interface DragData {
  type: 'task' | 'resize';
  task: Task;
}

export interface DropData {
  type: 'time-slot' | 'unscheduled';
  hour?: number;
  minutes?: number;
  date?: string;
}

interface DragState {
  activeTask: Task | null;
  dragType: 'move' | 'resize' | null;
  hoverSlot: { date: string; hour: number; minutes: number } | null;
}

const DragStateContext = createContext<DragState>({ activeTask: null, dragType: null, hoverSlot: null });

export function useDragState() {
  return useContext(DragStateContext);
}

// Helper to check if a slot is within the drop range for moving
export function isSlotInDropRange(
  slotDate: string,
  slotHour: number,
  slotMinutes: number,
  dragState: DragState
): boolean {
  const { activeTask, dragType, hoverSlot } = dragState;
  if (!activeTask || !hoverSlot || dragType !== 'move') return false;
  if (slotDate !== hoverSlot.date) return false;

  const slotTotalMinutes = slotHour * 60 + slotMinutes;
  const hoverTotalMinutes = hoverSlot.hour * 60 + hoverSlot.minutes;
  const taskDuration = activeTask.duration_minutes;

  return slotTotalMinutes >= hoverTotalMinutes && slotTotalMinutes < hoverTotalMinutes + taskDuration;
}

// Helper to check if a slot is within the resize range
export function isSlotInResizeRange(
  slotDate: string,
  slotHour: number,
  slotMinutes: number,
  dragState: DragState
): boolean {
  const { activeTask, dragType, hoverSlot } = dragState;
  if (!activeTask || !hoverSlot || dragType !== 'resize') return false;
  if (!activeTask.scheduled_time) return false;
  if (slotDate !== hoverSlot.date) return false;

  // Parse task start time
  const [taskHour, taskMin] = activeTask.scheduled_time.split(':').map(Number);
  const taskStartMinutes = taskHour * 60 + taskMin;

  const slotTotalMinutes = slotHour * 60 + slotMinutes;
  const hoverTotalMinutes = hoverSlot.hour * 60 + hoverSlot.minutes;

  // The resize end is the slot AFTER the hovered slot (end of the 15-min block)
  const resizeEndMinutes = hoverTotalMinutes + 15;

  // Slot is in range if it's >= task start and < resize end
  return slotTotalMinutes >= taskStartMinutes && slotTotalMinutes < resizeEndMinutes;
}

export function CalendarDndContext({ children }: CalendarDndContextProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{ date: string; hour: number; minutes: number } | null>(null);
  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data?.type === 'task') {
      setActiveTask(data.task);
      setDragType('move');
    } else if (data?.type === 'resize') {
      setActiveTask(data.task);
      setDragType('resize');
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setHoverSlot(null);
      return;
    }

    const dropData = over.data.current as DropData | undefined;
    if (dropData?.type === 'time-slot' && dropData.date && dropData.hour !== undefined) {
      setHoverSlot({
        date: dropData.date,
        hour: dropData.hour,
        minutes: dropData.minutes ?? 0,
      });
    } else {
      setHoverSlot(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const currentDragType = dragType;
      const currentTask = activeTask;

      setActiveTask(null);
      setDragType(null);
      setHoverSlot(null);

      if (!over || !currentTask) return;

      const dragData = active.data.current as DragData | undefined;
      const dropData = over.data.current as DropData | undefined;

      if (!dragData || !dropData) return;

      if (currentDragType === 'move' && dragData.type === 'task') {
        if (dropData.type === 'time-slot') {
          const newTime = dropData.hour !== undefined
            ? `${dropData.hour.toString().padStart(2, '0')}:${(dropData.minutes ?? 0).toString().padStart(2, '0')}`
            : undefined;
          const newDate = dropData.date;

          const timeChanged = newTime !== currentTask.scheduled_time;
          const dateChanged = newDate && newDate !== currentTask.scheduled_date;

          if (timeChanged || dateChanged) {
            updateTask.mutate({
              id: currentTask.id,
              ...(timeChanged && { scheduled_time: newTime }),
              ...(dateChanged && { scheduled_date: newDate }),
            });
          }
        } else if (dropData.type === 'unscheduled') {
          if (currentTask.scheduled_time) {
            updateTask.mutate({
              id: currentTask.id,
              clear_scheduled_time: true,
            });
          }
        }
      } else if (currentDragType === 'resize' && dragData.type === 'resize') {
        if (dropData.type === 'time-slot' && currentTask.scheduled_time) {
          // Calculate new duration based on drop position
          const [taskHour, taskMin] = currentTask.scheduled_time.split(':').map(Number);
          const taskStartMinutes = taskHour * 60 + taskMin;

          const dropHour = dropData.hour ?? 0;
          const dropMinutes = dropData.minutes ?? 0;
          const dropEndMinutes = dropHour * 60 + dropMinutes + 15; // End of the dropped slot

          const newDuration = Math.max(15, dropEndMinutes - taskStartMinutes);

          if (newDuration !== currentTask.duration_minutes) {
            updateTask.mutate({
              id: currentTask.id,
              duration_minutes: newDuration,
            });
          }
        }
      }
    },
    [updateTask, dragType, activeTask]
  );

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setDragType(null);
    setHoverSlot(null);
  }, []);

  return (
    <DragStateContext.Provider value={{ activeTask, dragType, hoverSlot }}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeTask && dragType === 'move' ? <TaskDragPreview task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </DragStateContext.Provider>
  );
}

interface TaskDragPreviewProps {
  task: Task;
}

function TaskDragPreview({ task }: TaskDragPreviewProps) {
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
        'px-2 py-1 rounded border-l-2 text-sm shadow-lg opacity-90 cursor-grabbing max-w-[200px]',
        !task.color && priorityColors[task.priority]
      )}
      style={customColorStyle}
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
