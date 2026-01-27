import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '../services/database';
import type { UpsertGoalInput } from '../types';

export function useGoals(date: string) {
  return useQuery({
    queryKey: ['goals', date],
    queryFn: () => db.getGoalsForDate(date),
  });
}

export function useUpsertGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertGoalInput) => db.upsertGoal(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals', variables.goal_date] });
    },
  });
}

export function useToggleGoalCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.toggleGoalCompletion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
