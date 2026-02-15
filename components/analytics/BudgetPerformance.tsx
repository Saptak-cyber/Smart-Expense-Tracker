'use client';

import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface BudgetPerformanceProps {
  budgets: {
    category: string;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'good' | 'approaching' | 'warning' | 'critical' | 'exceeded';
  }[];
}

export default function BudgetPerformance({ budgets }: BudgetPerformanceProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-500';
      case 'approaching':
        return 'text-blue-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-orange-500';
      case 'exceeded':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'approaching':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-orange-500';
      case 'exceeded':
        return 'bg-destructive';
      default:
        return 'bg-primary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'approaching':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'exceeded':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string, percentage: number) => {
    switch (status) {
      case 'good':
        return 'On track';
      case 'approaching':
        return '60%+ used';
      case 'warning':
        return '75%+ Alert';
      case 'critical':
        return '90%+ Critical';
      case 'exceeded':
        return 'Exceeded';
      default:
        return '';
    }
  };

  const overallSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const overallLimit = budgets.reduce((acc, b) => acc + b.limit, 0);
  const overallPercentage = (overallSpent / overallLimit) * 100;

  return (
    <div className="p-6 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Budget Performance</h3>

      {/* Overall Summary */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Budget</span>
          <span className="text-sm font-semibold">
            ₹{overallSpent.toFixed(0)} / ₹{overallLimit.toFixed(0)}
          </span>
        </div>
        <Progress value={overallPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {overallPercentage > 100 ? (
            <span className="text-destructive">
              Over budget by ₹{(overallSpent - overallLimit).toFixed(2)}
            </span>
          ) : (
            <span>
              ₹{(overallLimit - overallSpent).toFixed(2)} remaining (
              {(100 - overallPercentage).toFixed(1)}%)
            </span>
          )}
        </p>
      </div>

      {/* Individual Budgets */}
      <div className="space-y-4">
        {budgets.map((budget) => (
          <div key={budget.category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(budget.status)}
                <span className="text-sm font-medium">{budget.category}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(budget.status)} bg-opacity-10`}
                >
                  {getStatusLabel(budget.status, budget.percentage)}
                </span>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${getStatusColor(budget.status)}`}>
                  ₹{budget.spent.toFixed(0)} / ₹{budget.limit.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {budget.percentage.toFixed(0)}% used
                </p>
              </div>
            </div>
            <Progress value={Math.min(budget.percentage, 100)} className="h-2" />
          </div>
        ))}
      </div>

      {budgets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No budgets set for this period</div>
      )}
    </div>
  );
}
