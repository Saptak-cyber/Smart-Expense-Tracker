'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subMonths } from 'date-fns';

interface SpendingTrendsProps {
  data: {
    month: string;
    total: number;
    budget?: number;
  }[];
}

export default function SpendingTrends({ data }: SpendingTrendsProps) {
  return (
    <div className="p-6 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Spending Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            formatter={(value: number) => [`₹${value.toFixed(2)}`, '']}
          />
          <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            name="Spending"
            dot={{ fill: 'hsl(var(--primary))' }}
          />
          {data.some((d) => d.budget) && (
            <Line
              type="monotone"
              dataKey="budget"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Budget"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
