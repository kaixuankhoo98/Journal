import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/Button';
import { Input, Textarea, Select } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useCreateTask, useUpdateTask } from '../../../hooks';
import { useAppStore } from '../../../stores/appStore';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scheduled_date: z.string().min(1, 'Date is required'),
  scheduled_time: z.string().optional(),
  duration_minutes: z.coerce.number().min(0).optional(),
  priority: z.enum(['high', 'medium', 'low']),
  reminder_minutes: z.coerce.number().min(0).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export function TaskForm() {
  const { isTaskModalOpen, closeTaskModal, editingTask, selectedDate } = useAppStore();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: editingTask
      ? {
          title: editingTask.title,
          description: editingTask.description || '',
          scheduled_date: editingTask.scheduled_date,
          scheduled_time: editingTask.scheduled_time || '',
          duration_minutes: editingTask.duration_minutes,
          priority: editingTask.priority,
          reminder_minutes: editingTask.reminder_minutes || 0,
        }
      : {
          title: '',
          description: '',
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          scheduled_time: '',
          duration_minutes: 30,
          priority: 'medium',
          reminder_minutes: 0,
        },
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({
          id: editingTask.id,
          ...data,
          scheduled_time: data.scheduled_time || undefined,
          reminder_minutes: data.reminder_minutes || undefined,
        });
      } else {
        await createTask.mutateAsync({
          ...data,
          scheduled_time: data.scheduled_time || undefined,
          reminder_minutes: data.reminder_minutes || undefined,
        });
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleClose = () => {
    reset();
    closeTaskModal();
  };

  return (
    <Modal
      isOpen={isTaskModalOpen}
      onClose={handleClose}
      title={editingTask ? 'Edit Task' : 'New Task'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          placeholder="What needs to be done?"
          error={errors.title?.message}
          {...register('title')}
        />

        <Textarea
          label="Description"
          placeholder="Add more details..."
          {...register('description')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Date"
            error={errors.scheduled_date?.message}
            {...register('scheduled_date')}
          />
          <Input
            type="time"
            label="Time (optional)"
            {...register('scheduled_time')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Duration (minutes)"
            min={0}
            {...register('duration_minutes')}
          />
          <Select
            label="Priority"
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            {...register('priority')}
          />
        </div>

        <Input
          type="number"
          label="Reminder (minutes before)"
          placeholder="0 for no reminder"
          min={0}
          {...register('reminder_minutes')}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {editingTask ? 'Update' : 'Create'} Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
