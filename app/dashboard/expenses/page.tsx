'use client';

import ModernLayout from '@/components/layout/ModernLayout';
import AddExpenseModal from '@/components/modals/AddExpenseModal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { supabase } from '@/lib/supabase';
import { Download, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function ExpensesPage() {
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useExpenses({
    limit: 50,
  });

  useEffect(() => {
    checkUser();
    loadCategories();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  const handleExport = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          format: 'csv',
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses.csv';
      a.click();
      toast.success('Expenses exported successfully');
    } catch (error) {
      toast.error('Failed to export expenses');
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to continue');
        return;
      }

      const response = await fetch(`/api/expenses?id=${expenseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete expense');
      }

      toast.success('Expense deleted successfully');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete expense');
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingExpense(null);
  };

  const allExpenses = data?.pages?.flatMap((page) => page.data) || [];

  return (
    <ModernLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground">Manage your transactions</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Loading expenses...</p>
                  </TableCell>
                </TableRow>
              )}

              {isError && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-destructive">
                    Failed to load expenses. Please try again.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && allExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <p className="text-muted-foreground">No expenses found.</p>
                    <Button
                      onClick={() => setShowAddModal(true)}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add your first expense
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {allExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{expense.categories?.icon}</span>
                      <span>{expense.categories?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.description || '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{Number(expense.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="py-4 text-center">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddExpenseModal
          user={user}
          categories={categories}
          expense={editingExpense}
          onClose={handleModalClose}
          onSuccess={() => {
            handleModalClose();
            window.location.reload();
          }}
        />
      )}
    </ModernLayout>
  );
}
