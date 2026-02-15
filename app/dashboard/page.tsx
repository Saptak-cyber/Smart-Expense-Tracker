'use client';

import CategoryPieChart from '@/components/charts/CategoryPieChart';
import ExpenseChart from '@/components/charts/ExpenseChart';
import EnhancedStatsCard from '@/components/dashboard/EnhancedStatsCard';
import InsightCard from '@/components/dashboard/InsightCard';
import RecentExpenses from '@/components/dashboard/RecentExpenses';
import ModernLayout from '@/components/layout/ModernLayout';
import { ensureUserProfile } from '@/lib/ensure-profile';
import { supabase } from '@/lib/supabase';
import { Calendar, CreditCard, Target, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    await ensureUserProfile(user.id, user.email!, user.user_metadata?.full_name);

    setUser(user);
    loadExpenses(user.id);
  };

  const loadExpenses = async (userId: string) => {
    const { data } = await supabase
      .from('expenses')
      .select('*, categories(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(50);

    setExpenses(data || []);
    await loadBudgets(userId);
  };

  const loadBudgets = async (userId: string) => {
    const now = new Date();
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear());

    setBudgets(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <ModernLayout user={user}>
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <EnhancedStatsCard key={i} title="Loading..." value="--" loading={true} />
            ))}
          </div>
        </div>
      </ModernLayout>
    );
  }

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const now = new Date();
  const thisMonth = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return (
      expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
    );
  });
  const monthlyTotal = thisMonth.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const lastMonth = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return (
      expenseDate.getMonth() === lastMonthDate.getMonth() &&
      expenseDate.getFullYear() === lastMonthDate.getFullYear()
    );
  });
  const lastMonthTotal = lastMonth.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const monthlyTrend =
    lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const thisWeek = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return expenseDate >= oneWeekAgo;
  });
  const weeklyTotal = thisWeek.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate.toDateString() === date.toDateString();
    });
    return dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  });

  const avgTransaction = expenses.length > 0 ? totalSpent / expenses.length : 0;

  const budgetTotal = budgets.reduce((sum, b) => sum + parseFloat(b.monthly_limit), 0);
  const budgetUsed = budgetTotal > 0 ? (monthlyTotal / budgetTotal) * 100 : 0;

  return (
    <ModernLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Welcome back, {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Current Period</p>
            <p className="text-lg font-semibold text-white">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedStatsCard
            title="This Month"
            value={monthlyTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            prefix="₹"
            subtitle={`${thisMonth.length} transactions`}
            trend={monthlyTrend}
            icon={Calendar}
            sparklineData={last7Days}
          />
          <EnhancedStatsCard
            title="This Week"
            value={weeklyTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            prefix="₹"
            subtitle={`${thisWeek.length} transactions`}
            icon={TrendingDown}
          />
          <EnhancedStatsCard
            title="Avg Transaction"
            value={avgTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            prefix="₹"
            subtitle="Per expense"
            icon={CreditCard}
          />
          <EnhancedStatsCard
            title="Budget Used"
            value={budgetUsed.toFixed(1)}
            subtitle={`₹${monthlyTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })} of ₹${budgetTotal.toLocaleString('en-IN')}`}
            trend={budgetUsed > 75 ? 15 : -10}
            icon={Target}
          />
        </div>

        {/* <InsightCard /> */}

        <div className="grid lg:grid-cols-2 gap-6">
          <ExpenseChart expenses={expenses} />
          <CategoryPieChart expenses={expenses} />
        </div>

        <RecentExpenses expenses={expenses.slice(0, 10)} />
      </div>
    </ModernLayout>
  );
}
