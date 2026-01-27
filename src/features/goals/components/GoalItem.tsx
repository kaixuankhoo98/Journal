import { useState, useRef, useEffect } from 'react';
import { Target, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useToggleGoalCompletion, useUpsertGoal, useDeleteGoal } from '../../../hooks';
import type { DailyGoal } from '../../../types';

interface GoalItemProps {
  goal?: DailyGoal;
  goalOrder: number;
  date: string;
  placeholder?: string;
}

export function GoalItem({ goal, goalOrder, date, placeholder }: GoalItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(goal?.goal_text || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleCompletion = useToggleGoalCompletion();
  const upsertGoal = useUpsertGoal();
  const deleteGoal = useDeleteGoal();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setText(goal?.goal_text || '');
  }, [goal?.goal_text]);

  const handleToggle = () => {
    if (goal) {
      toggleCompletion.mutate(goal.id);
    }
  };

  const handleSave = () => {
    if (text.trim()) {
      upsertGoal.mutate({
        goal_date: date,
        goal_text: text.trim(),
        goal_order: goalOrder,
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (goal) {
      deleteGoal.mutate(goal.id);
    }
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setText(goal?.goal_text || '');
      setIsEditing(false);
    }
  };

  const colors = [
    'bg-lavender-100 border-lavender-200',
    'bg-coral-100 border-coral-200',
    'bg-sage-100 border-sage-200',
  ];

  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-2 rounded-lg border transition-all',
        colors[goalOrder - 1] || colors[0],
        goal?.is_completed && 'opacity-60'
      )}
    >
      {goal ? (
        <Checkbox
          checked={goal.is_completed}
          onChange={handleToggle}
          className="shrink-0"
        />
      ) : (
        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
          <Target className="w-4 h-4 text-gray-300" />
        </div>
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Goal ${goalOrder}`}
          className="flex-1 bg-transparent outline-none text-sm"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={cn(
            'flex-1 text-sm cursor-pointer',
            goal?.is_completed && 'line-through text-gray-400',
            !goal && 'text-gray-400 italic'
          )}
        >
          {goal?.goal_text || placeholder || `Click to add goal ${goalOrder}`}
        </span>
      )}

      {goal && (
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/50 rounded transition-all"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      )}
    </div>
  );
}
