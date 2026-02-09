import { requireAuth } from '@/lib/auth-utils';
import { getEnv } from '@/lib/env';
import { createClient } from '@supabase/supabase-js';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const dynamic = 'force-dynamic';

function getSupabaseAuthed(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const { searchParams } = new URL(request.url);
  const months = parseInt(searchParams.get('months') || '6');

  try {
    const supabase = getSupabaseAuthed(request);

    // Calculate date range - use simple date arithmetic without time components
    const today = new Date();
    const endDateStr = format(today, 'yyyy-MM-dd');
    const startDateObj = subMonths(today, months);
    const startDateStr = format(startDateObj, 'yyyy-MM-dd');

    console.log('Analytics query details:', {
      userId,
      months,
      startDate: startDateStr,
      endDate: endDateStr,
      today: today.toISOString(),
    });

    // Fetch all expenses in date range (RLS handles user filtering)
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*, categories(*)')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    console.log('Expenses query result:', {
      count: expenses?.length || 0,
      error: expensesError?.message,
      sample: expenses
        ?.slice(0, 3)
        .map((e) => ({ date: e.date, amount: e.amount, category: e.categories?.name })),
    });

    if (expensesError) throw expensesError;

    // Fetch budgets (RLS handles user filtering)
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*, categories(*)');

    if (budgetsError) throw budgetsError;

    // Calculate monthly trends
    const monthlyTrends = [];
    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthExpenses =
        expenses?.filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        }) || [];

      const total = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      monthlyTrends.unshift({
        month: format(monthDate, 'MMM yyyy'),
        total: parseFloat(total.toFixed(2)),
      });
    }

    // Calculate category breakdown
    const categoryMap = new Map<string, number>();
    expenses?.forEach((e) => {
      const categoryName = e.categories?.name || 'Uncategorized';
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + parseFloat(e.amount));
    });

    const totalSpent = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
        percentage: (value / totalSpent) * 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Calculate top merchants (from descriptions)
    const merchantMap = new Map<string, { amount: number; count: number }>();
    expenses?.forEach((e) => {
      if (e.description) {
        const merchant = e.description.split(' ')[0]; // Simple heuristic
        const current = merchantMap.get(merchant) || { amount: 0, count: 0 };
        merchantMap.set(merchant, {
          amount: current.amount + parseFloat(e.amount),
          count: current.count + 1,
        });
      }
    });

    const topMerchants = Array.from(merchantMap.entries())
      .map(([merchant, data]) => ({
        merchant,
        amount: parseFloat(data.amount.toFixed(2)),
        count: data.count,
        trend: 'neutral' as const,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Calculate budget performance
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const budgetPerformance =
      budgets?.map((budget) => {
        const categoryExpenses =
          expenses?.filter(
            (e) =>
              e.category_id === budget.category_id &&
              new Date(e.date).getMonth() + 1 === currentMonth &&
              new Date(e.date).getFullYear() === currentYear
          ) || [];

        const spent = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const percentage = (spent / parseFloat(budget.monthly_limit)) * 100;

        return {
          category: budget.categories?.name || 'Unknown',
          limit: parseFloat(budget.monthly_limit),
          spent: parseFloat(spent.toFixed(2)),
          remaining: parseFloat((parseFloat(budget.monthly_limit) - spent).toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
          status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good',
        };
      }) || [];

    // Generate AI insights
    const insights = [];

    // Average daily spending
    const avgDaily = totalSpent / 30;
    insights.push({
      type: 'info',
      title: 'Daily Average',
      description: `You spend an average of ₹${avgDaily.toFixed(2)} per day`,
    });

    // Category with highest spending
    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown[0];
      insights.push({
        type: 'warning',
        title: 'Top Spending Category',
        description: `${topCategory.name} accounts for ${topCategory.percentage.toFixed(0)}% of your total spending`,
      });
    }

    // Budget warnings
    const exceededBudgets = budgetPerformance.filter((b) => b.status === 'exceeded');
    if (exceededBudgets.length > 0) {
      insights.push({
        type: 'negative',
        title: 'Budget Alert',
        description: `You've exceeded ${exceededBudgets.length} budget(s) this month`,
      });
    }

    // Positive trend
    if (monthlyTrends.length >= 2) {
      const lastMonth = monthlyTrends[monthlyTrends.length - 1].total;
      const prevMonth = monthlyTrends[monthlyTrends.length - 2].total;
      if (lastMonth < prevMonth) {
        const savings = prevMonth - lastMonth;
        insights.push({
          type: 'positive',
          title: 'Spending Reduced',
          description: `You saved ₹${savings.toFixed(2)} compared to last month!`,
        });
      }
    }

    return NextResponse.json({
      monthlyTrends,
      categoryBreakdown,
      topMerchants,
      budgetPerformance,
      insights,
      summary: {
        totalExpenses: expenses?.length || 0,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        avgPerExpense: expenses?.length ? parseFloat((totalSpent / expenses.length).toFixed(2)) : 0,
        avgDaily: parseFloat(avgDaily.toFixed(2)),
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
