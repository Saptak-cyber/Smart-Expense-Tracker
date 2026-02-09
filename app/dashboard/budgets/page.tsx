'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetModal } from '@/components/modals/BudgetModal';
import { Budget, Category, Expense } from '@/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import ModernLayout from '@/components/layout/ModernLayout';

export default function BudgetsPage() {
  const [user, setUser] = useState<any>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const token = session.access_token;

      // Fetch all budgets
      const budgetsResponse = await fetch(
        `/api/budgets`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const budgetsData = await budgetsResponse.json();
      setBudgets(budgetsData);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      setCategories(categoriesData || []);

      // Fetch all expenses (we'll filter by budget month when calculating spent)
      const expensesResponse = await fetch(
        `/api/expenses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const expensesData = await expensesResponse.json();
      setExpenses(expensesData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const getSpentAmount = (categoryId: string, month: number, year: number) => {
    return expenses
      .filter((e) => {
        if (e.category_id !== categoryId) return false;
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year;
      })
      .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/budgets?id=${budgetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }

      toast.success('Budget deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  if (loading) {
    return (
      <ModernLayout user={user}>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading budgets...</div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout user={user}>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">
            Manage your monthly spending limits
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No budgets created yet</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              spent={getSpentAmount(budget.category_id, budget.month, budget.year)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <BudgetModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={fetchData}
        budget={editingBudget}
        categories={categories}
      />
      </div>
    </ModernLayout>
  );
}
