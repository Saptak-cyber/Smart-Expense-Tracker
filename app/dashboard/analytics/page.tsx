'use client';

import BudgetPerformance from '@/components/analytics/BudgetPerformance';
import CategoryBreakdown from '@/components/analytics/CategoryBreakdown';
import InsightsPanel from '@/components/analytics/InsightsPanel';
import SpendingTrends from '@/components/analytics/SpendingTrends';
import TopMerchants from '@/components/analytics/TopMerchants';
import ModernLayout from '@/components/layout/ModernLayout';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1');
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, timeRange]);

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

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/analytics/detailed?months=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load analytics');

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!analyticsData) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Expense Analytics Report', 20, 20);

    // Summary
    doc.setFontSize(12);
    doc.text(`Total Expenses: ${analyticsData.summary.totalExpenses}`, 20, 40);
    doc.text(`Total Spent: ₹${analyticsData.summary.totalSpent}`, 20, 50);
    doc.text(`Average per Expense: ₹${analyticsData.summary.avgPerExpense}`, 20, 60);
    doc.text(`Average Daily: ₹${analyticsData.summary.avgDaily}`, 20, 70);

    // Category Breakdown
    doc.setFontSize(16);
    doc.text('Category Breakdown', 20, 90);
    doc.setFontSize(10);
    let y = 100;
    analyticsData.categoryBreakdown.forEach((cat: any) => {
      doc.text(`${cat.name}: ₹${cat.value} (${cat.percentage.toFixed(1)}%)`, 30, y);
      y += 10;
    });

    doc.save('expense-analytics.pdf');
    toast.success('PDF exported successfully');
  };

  const exportToExcel = () => {
    if (!analyticsData) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Expenses', analyticsData.summary.totalExpenses],
      ['Total Spent', `₹${analyticsData.summary.totalSpent}`],
      ['Average per Expense', `₹${analyticsData.summary.avgPerExpense}`],
      ['Average Daily', `₹${analyticsData.summary.avgDaily}`],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Category breakdown sheet
    const categoryData = [
      ['Category', 'Amount', 'Percentage'],
      ...analyticsData.categoryBreakdown.map((cat: any) => [
        cat.name,
        cat.value,
        `${cat.percentage.toFixed(1)}%`,
      ]),
    ];
    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, categorySheet, 'Categories');

    // Monthly trends sheet
    const trendsData = [
      ['Month', 'Spending'],
      ...analyticsData.monthlyTrends.map((month: any) => [month.month, month.total]),
    ];
    const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
    XLSX.utils.book_append_sheet(wb, trendsSheet, 'Monthly Trends');

    XLSX.writeFile(wb, 'expense-analytics.xlsx');
    toast.success('Excel exported successfully');
  };

  return (
    <ModernLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Deep dive into your spending patterns</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 month</SelectItem>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        ) : analyticsData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative p-6 bg-gradient-to-br from-violet-500/10 to-violet-600/5 rounded-lg border border-violet-500/20 overflow-hidden group hover:border-violet-500/40 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform" />
                <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent">
                  {analyticsData.summary.totalExpenses}
                </p>
              </div>
              <div className="relative p-6 bg-gradient-to-br from-pink-500/10 to-pink-600/5 rounded-lg border border-pink-500/20 overflow-hidden group hover:border-pink-500/40 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform" />
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                  ₹{analyticsData.summary.totalSpent}
                </p>
              </div>
              <div className="relative p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg border border-blue-500/20 overflow-hidden group hover:border-blue-500/40 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform" />
                <p className="text-sm text-muted-foreground mb-1">Avg per Expense</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  ₹{analyticsData.summary.avgPerExpense}
                </p>
              </div>
              <div className="relative p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-lg border border-emerald-500/20 overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform" />
                <p className="text-sm text-muted-foreground mb-1">Daily Average</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                  ₹{analyticsData.summary.avgDaily}
                </p>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendingTrends data={analyticsData.monthlyTrends} />
              <CategoryBreakdown data={analyticsData.categoryBreakdown} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopMerchants data={analyticsData.topMerchants} />
              <BudgetPerformance budgets={analyticsData.budgetPerformance} />
            </div>

            {/* Insights */}
            <InsightsPanel insights={analyticsData.insights} />
          </>
        ) : null}
      </div>
    </ModernLayout>
  );
}
