import { Clock, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Button } from '../../../components/ui/Button';
import { useToggleTaskCompletion, useDeleteTask } from '../../../hooks';
import type { Task } from '../../../types';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskItem({ task, onEdit }: TaskItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const toggleCompletion = useToggleTaskCompletion();
  const deleteTask = useDeleteTask();

  const priorityClasses: Record<string, string> = {
    high: 'border-l-coral-500 bg-coral-50/50',
    medium: 'border-l-journal-500 bg-journal-50/50',
    low: 'border-l-sage-500 bg-sage-50/50',
  };

  const customColorStyle = task.color
    ? { borderLeftColor: task.color, backgroundColor: `${task.color}20` }
    : undefined;

  const handleToggle = () => {
    toggleCompletion.mutate(task.id);
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id);
    setShowMenu(false);
  };

  return (
    <div
      className={cn(
        'relative group p-3 rounded-lg border-l-4 transition-all duration-200',
        'hover:shadow-md',
        !task.color && priorityClasses[task.priority],
        task.is_completed && 'opacity-60'
      )}
      style={customColorStyle}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.is_completed}
          onChange={handleToggle}
          className="mt-0.5"
        />

        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'font-medium text-gray-900 truncate',
              task.is_completed && 'line-through text-gray-400'
            )}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {task.scheduled_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.scheduled_time}
              </span>
            )}
            {task.duration_minutes > 0 && (
              <span>{task.duration_minutes}min</span>
            )}
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-xs font-medium uppercase',
                task.priority === 'high' && 'bg-coral-100 text-coral-700',
                task.priority === 'medium' && 'bg-journal-100 text-journal-700',
                task.priority === 'low' && 'bg-sage-100 text-sage-700'
              )}
            >
              {task.priority}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[120px]">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    onEdit(task);
                    setShowMenu(false);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm text-coral-600 hover:bg-coral-50 flex items-center gap-2"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
