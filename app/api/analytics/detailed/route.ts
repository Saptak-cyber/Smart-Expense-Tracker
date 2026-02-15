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

    // Calculate top merchants (from descriptions) with improved normalization
    const merchantMap = new Map<string, { amount: number; count: number }>();
    expenses?.forEach((e) => {
      if (e.description) {
        // Improved merchant extraction: normalize and clean merchant names
        let merchant = e.description.trim();

        // Take first 2-3 words for better merchant identification
        const words = merchant.split(/\s+/);
        if (words.length > 3) {
          merchant = words.slice(0, 3).join(' ');
        }

        // Normalize: lowercase for grouping, then capitalize for display
        const normalizedKey = merchant.toLowerCase();
        const current = merchantMap.get(normalizedKey) || { amount: 0, count: 0 };
        merchantMap.set(normalizedKey, {
          amount: current.amount + parseFloat(e.amount),
          count: current.count + 1,
        });
      }
    });

    const topMerchants = Array.from(merchantMap.entries())
      .map(([merchant, data]) => ({
        merchant: merchant
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '), // Capitalize
        amount: parseFloat(data.amount.toFixed(2)),
        count: data.count,
        avgTransaction: parseFloat((data.amount / data.count).toFixed(2)),
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

        // Smart budget alert system: 75%, 90%, 100%
        let status: 'good' | 'approaching' | 'warning' | 'critical' | 'exceeded';
        if (percentage >= 100) {
          status = 'exceeded';
        } else if (percentage >= 90) {
          status = 'critical';
        } else if (percentage >= 75) {
          status = 'warning';
        } else if (percentage >= 60) {
          status = 'approaching';
        } else {
          status = 'good';
        }

        return {
          category: budget.categories?.name || 'Unknown',
          limit: parseFloat(budget.monthly_limit),
          spent: parseFloat(spent.toFixed(2)),
          remaining: parseFloat((parseFloat(budget.monthly_limit) - spent).toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
          status,
        };
      }) || [];

    // Generate AI insights
    const insights = [];

    // Average daily spending - calculate based on actual time range
    const daysInRange = months * 30; // Approximate days in the selected period
    const avgDaily = totalSpent / daysInRange;
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

    // Smart budget alerts at 75%, 90%, 100%
    const exceededBudgets = budgetPerformance.filter((b) => b.status === 'exceeded');
    if (exceededBudgets.length > 0) {
      insights.push({
        type: 'negative',
        title: 'Budget Exceeded',
        description: `You've exceeded ${exceededBudgets.length} budget(s) this month. Review your spending immediately.`,
      });
    }

    // Critical alert at 90%
    const criticalBudgets = budgetPerformance.filter((b) => b.status === 'critical');
    if (criticalBudgets.length > 0) {
      const budgetNames = criticalBudgets.map((b) => b.category).join(', ');
      insights.push({
        type: 'negative',
        title: 'Critical Budget Alert (90%+)',
        description: `${budgetNames}: You're at 90%+ of your limit. Slow down spending to avoid exceeding.`,
      });
    }

    // Warning at 75%
    const warningBudgets = budgetPerformance.filter((b) => b.status === 'warning');
    if (warningBudgets.length > 0) {
      const budgetNames = warningBudgets.map((b) => b.category).join(', ');
      insights.push({
        type: 'warning',
        title: 'Budget Warning (75%+)',
        description: `${budgetNames}: You've used 75%+ of your budget. Monitor your spending closely.`,
      });
    }

    // Approaching limit at 60%
    const approachingBudgets = budgetPerformance.filter((b) => b.status === 'approaching');
    if (
      approachingBudgets.length > 0 &&
      exceededBudgets.length === 0 &&
      criticalBudgets.length === 0
    ) {
      insights.push({
        type: 'info',
        title: 'Budget Approaching Limit',
        description: `${approachingBudgets.length} budget(s) are at 60%+ of their limit. Plan your spending carefully.`,
      });
    }

    // Positive trend - spending reduced
    if (monthlyTrends.length >= 2) {
      const lastMonth = monthlyTrends[monthlyTrends.length - 1].total;
      const prevMonth = monthlyTrends[monthlyTrends.length - 2].total;
      if (lastMonth < prevMonth) {
        const savings = prevMonth - lastMonth;
        const percentageDecrease = ((savings / prevMonth) * 100).toFixed(1);
        insights.push({
          type: 'positive',
          title: 'Spending Reduced',
          description: `You saved ₹${savings.toFixed(2)} (${percentageDecrease}%) compared to last month!`,
        });
      } else if (lastMonth > prevMonth) {
        const increase = lastMonth - prevMonth;
        const percentageIncrease = ((increase / prevMonth) * 100).toFixed(1);
        insights.push({
          type: 'negative',
          title: 'Spending Increased',
          description: `Your spending increased by ₹${increase.toFixed(2)} (${percentageIncrease}%) compared to last month`,
        });
      }
    }

    // Spending consistency analysis
    if (monthlyTrends.length >= 3) {
      const amounts = monthlyTrends.map((m) => m.total);
      const avg = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
      const variance =
        amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = (stdDev / avg) * 100;

      if (coefficientOfVariation < 15) {
        insights.push({
          type: 'positive',
          title: 'Consistent Spending',
          description: `Your spending pattern is very consistent, making it easier to budget`,
        });
      } else if (coefficientOfVariation > 40) {
        insights.push({
          type: 'warning',
          title: 'Irregular Spending',
          description: `Your spending varies significantly month-to-month. Consider reviewing your expenses`,
        });
      }
    }

    // High-value transaction detection
    if (expenses && expenses.length > 0) {
      const avgExpense = totalSpent / expenses.length;
      const highValueExpenses = expenses.filter((e) => parseFloat(e.amount) > avgExpense * 3);

      if (highValueExpenses.length > 0) {
        const highValueTotal = highValueExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const highValuePercentage = ((highValueTotal / totalSpent) * 100).toFixed(0);
        insights.push({
          type: 'info',
          title: 'Large Transactions',
          description: `${highValueExpenses.length} large transaction(s) account for ${highValuePercentage}% of your spending`,
        });
      }
    }

    // Category diversification
    if (categoryBreakdown.length > 0) {
      const topThreePercentage = categoryBreakdown
        .slice(0, 3)
        .reduce((sum, cat) => sum + cat.percentage, 0);

      if (topThreePercentage > 80) {
        insights.push({
          type: 'info',
          title: 'Concentrated Spending',
          description: `${topThreePercentage.toFixed(0)}% of your spending is in just 3 categories`,
        });
      } else if (categoryBreakdown.length >= 5) {
        insights.push({
          type: 'positive',
          title: 'Diversified Spending',
          description: `Your expenses are well-distributed across ${categoryBreakdown.length} categories`,
        });
      }
    }

    // Weekend vs weekday spending (if we have date data)
    if (expenses && expenses.length > 5) {
      const weekendExpenses = expenses.filter((e) => {
        const day = new Date(e.date).getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      });
      const weekdayExpenses = expenses.filter((e) => {
        const day = new Date(e.date).getDay();
        return day !== 0 && day !== 6;
      });

      if (weekendExpenses.length > 0 && weekdayExpenses.length > 0) {
        const weekendTotal = weekendExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const weekdayTotal = weekdayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const weekendAvg = weekendTotal / weekendExpenses.length;
        const weekdayAvg = weekdayTotal / weekdayExpenses.length;

        if (weekendAvg > weekdayAvg * 1.3) {
          const difference = ((weekendAvg / weekdayAvg - 1) * 100).toFixed(0);
          insights.push({
            type: 'info',
            title: 'Weekend Spending Pattern',
            description: `You spend ${difference}% more per transaction on weekends`,
          });
        }
      }
    }

    // Generate AI-powered insights using Gpt
    // Note: AI insights are now generated on-demand via the /api/analytics/ai-insights endpoint
    // This prevents automatic generation on every page load

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
