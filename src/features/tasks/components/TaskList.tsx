import { Plus, ListTodo } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { TaskItem } from './TaskItem';
import { useAppStore } from '../../../stores/appStore';
import type { Task } from '../../../types';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  title?: string;
}

export function TaskList({ tasks, isLoading, title = 'Tasks' }: TaskListProps) {
  const { openTaskModal } = useAppStore();

  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort by completion status first
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    // Then by time
    if (a.scheduled_time && b.scheduled_time) {
      return a.scheduled_time.localeCompare(b.scheduled_time);
    }
    if (a.scheduled_time) return -1;
    if (b.scheduled_time) return 1;
    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-400">
          Loading tasks...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-lavender-500" />
          {title}
        </CardTitle>
        <Button size="sm" onClick={() => openTaskModal()}>
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No tasks scheduled</p>
            <p className="text-sm mt-1">Click "Add Task" to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((task) => (
              <TaskItem key={task.id} task={task} onEdit={openTaskModal} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
