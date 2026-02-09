'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ModernLayout from '@/components/layout/ModernLayout';
import RecurringExpenseModal from '@/components/modals/RecurringExpenseModal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Calendar, Repeat } from 'lucide-react';
import { toast } from 'sonner';

export default function RecurringExpensesPage() {
  const [user, setUser] = useState<any>(null);
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    loadCategories();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    loadRecurringExpenses();
  };

  const loadRecurringExpenses = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch('/api/recurring-expenses', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (response.ok) {
      const data = await response.json();
      setRecurringExpenses(data);
    }
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring expense?')) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/recurring-expenses?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete recurring expense');
      }

      toast.success('Recurring expense deleted');
      loadRecurringExpenses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (expense: any) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/recurring-expenses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: expense.id,
          is_active: !expense.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update recurring expense');
      }

      toast.success(expense.is_active ? 'Recurring expense paused' : 'Recurring expense activated');
      loadRecurringExpenses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  return (
    <ModernLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Recurring Expenses</h1>
            <p className="text-muted-foreground">Automate your regular expenses</p>
          </div>
          <Button
            onClick={() => {
              setSelectedExpense(null);
              setShowModal(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Recurring Expense
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Occurrence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurringExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Repeat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No recurring expenses yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set up automatic expenses for bills, subscriptions, and more
                    </p>
                    <Button onClick={() => setShowModal(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add your first recurring expense
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {recurringExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{expense.categories?.icon}</span>
                      <span>{expense.categories?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.description || '-'}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{parseFloat(expense.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{getFrequencyLabel(expense.frequency)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(expense.next_occurrence).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleActive(expense)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        expense.is_active
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {expense.is_active ? 'Active' : 'Paused'}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowModal(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">How it works</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • Recurring expenses automatically create new expenses based on the frequency you set
            </li>
            <li>• You can pause or delete recurring expenses at any time</li>
            <li>• The system checks for due recurring expenses daily at midnight UTC</li>
            <li>• Set an end date if you want the recurring expense to stop automatically</li>
          </ul>
        </div>
      </div>

      {showModal && (
        <RecurringExpenseModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedExpense(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedExpense(null);
            loadRecurringExpenses();
          }}
          categories={categories}
          recurringExpense={selectedExpense}
        />
      )}
    </ModernLayout>
  );
}
