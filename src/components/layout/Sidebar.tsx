import { format } from 'date-fns';
import { useAppStore } from '../../stores/appStore';
import { DailyGoals } from '../../features/goals/components/DailyGoals';
import { JournalEntry } from '../../features/journal/components/JournalEntry';

export function Sidebar() {
  const { selectedDate } = useAppStore();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  return (
    <aside className="w-80 flex flex-col gap-4 p-4 bg-white/40 backdrop-blur-sm border-l border-gray-100 overflow-y-auto">
      {/* Daily Goals */}
      <DailyGoals date={dateStr} />

      {/* Journal Entry */}
      <JournalEntry date={dateStr} />
    </aside>
  );
}
