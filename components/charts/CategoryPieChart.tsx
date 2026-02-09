'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CHART_COLORS = [
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', 
  '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#8b5cf6'
];

export default function CategoryPieChart({ expenses }: any) {
  const categoryTotals = expenses.reduce((acc: any, expense: any) => {
    const categoryName = expense.categories?.name || 'Uncategorized';
    
    if (!acc[categoryName]) {
      acc[categoryName] = { name: categoryName, value: 0 };
    }
    acc[categoryName].value += parseFloat(expense.amount);
    return acc;
  }, {});

  const chartData = Object.values(categoryTotals).map((item: any, index: number) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
    percentage: 0
  }));

  const total = chartData.reduce((sum: number, item: any) => sum + item.value, 0);
  chartData.forEach((item: any) => {
    item.percentage = ((item.value / total) * 100).toFixed(1);
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            ₹{payload[0].value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground">
            {payload[0].payload.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground truncate">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="stroke-background hover:opacity-80 transition-opacity"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
