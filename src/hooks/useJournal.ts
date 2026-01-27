import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '../services/database';
import type { UpsertEntryInput } from '../types';

export function useJournalEntry(date: string) {
  return useQuery({
    queryKey: ['journal', date],
    queryFn: () => db.getEntryForDate(date),
  });
}

export function useUpsertEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertEntryInput) => db.upsertEntry(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal', variables.entry_date] });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}
