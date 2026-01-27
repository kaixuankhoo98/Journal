import { Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { GoalItem } from './GoalItem';
import { useGoals } from '../../../hooks';

interface DailyGoalsProps {
  date: string;
}

export function DailyGoals({ date }: DailyGoalsProps) {
  const { data: goals = [], isLoading } = useGoals(date);

  // Create array with 3 slots, filling with existing goals
  const goalSlots = [1, 2, 3].map((order) => ({
    order,
    goal: goals.find((g) => g.goal_order === order),
  }));

  const completedCount = goals.filter((g) => g.is_completed).length;
  const totalGoals = goals.length;

  return (
    <Card className="p-4">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4 text-lavender-500" />
            Today's Goals
          </span>
          {totalGoals > 0 && (
            <span className="text-sm font-normal text-gray-400">
              {completedCount}/{totalGoals}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-2">
        {isLoading ? (
          <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
        ) : (
          goalSlots.map(({ order, goal }) => (
            <GoalItem
              key={order}
              goal={goal}
              goalOrder={order}
              date={date}
              placeholder={`Goal ${order}`}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
