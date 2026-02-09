import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Budget } from '@/types';

interface UseBudgetsOptions {
  month?: number;
  year?: number;
}

export function useBudgets(options: UseBudgetsOptions = {}) {
  const { month, year } = options;

  return useQuery<Budget[]>({
    queryKey: ['budgets', { month, year }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month !== undefined) params.append('month', month.toString());
      if (year !== undefined) params.append('year', year.toString());

      const response = await fetch(`/api/budgets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }
      return response.json();
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create budget');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Budget> }) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update budget');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
