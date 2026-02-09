'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RecentExpenses({ expenses }: any) {
  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl">Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expenses.map((expense: any) => (
            <div
              key={expense.id}
              className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                  {expense.categories?.icon || '💰'}
                </div>
                <div>
                  <p className="font-medium text-foreground">{expense.description || 'Expense'}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.categories?.name || 'Uncategorized'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  ₹{parseFloat(expense.amount).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
