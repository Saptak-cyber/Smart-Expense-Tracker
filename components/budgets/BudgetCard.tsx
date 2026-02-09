'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Budget, Expense } from '@/types';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
}

export function BudgetCard({ budget, spent, onEdit, onDelete }: BudgetCardProps) {
  const percentage = (spent / budget.monthly_limit) * 100;
  const remaining = budget.monthly_limit - spent;
  const isOverBudget = spent > budget.monthly_limit;
  const isNearLimit = percentage >= 80 && !isOverBudget;

  const getStatusColor = () => {
    if (isOverBudget) return 'text-destructive';
    if (isNearLimit) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-destructive';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {budget.categories?.name || 'Unknown Category'}
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(budget)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="text-sm text-muted-foreground hover:text-destructive"
          >
            Delete
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-2xl font-bold">₹{spent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                of ₹{budget.monthly_limit.toLocaleString()}
              </p>
            </div>
            <div className={`flex items-center gap-1 ${getStatusColor()}`}>
              {isOverBudget ? (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    +₹{Math.abs(remaining).toLocaleString()}
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">₹{remaining.toLocaleString()} left</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Progress value={Math.min(percentage, 100)} className="h-2" />
            <div className="flex justify-between items-center text-xs">
              <span className={getStatusColor()}>{percentage.toFixed(0)}% used</span>
              {isNearLimit && !isOverBudget && (
                <span className="flex items-center gap-1 text-yellow-500">
                  <AlertCircle className="h-3 w-3" />
                  Near limit
                </span>
              )}
              {isOverBudget && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  Over budget
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2">
            {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'long' })}{' '}
            {budget.year}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
