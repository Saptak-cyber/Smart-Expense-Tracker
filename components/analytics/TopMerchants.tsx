'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopMerchantsProps {
  data: {
    merchant: string;
    amount: number;
    count: number;
    trend: 'up' | 'down' | 'neutral';
  }[];
}

export default function TopMerchants({ data }: TopMerchantsProps) {
  return (
    <div className="p-6 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Top Merchants</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `₹${value}`}
          />
          <YAxis 
            type="category"
            dataKey="merchant"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number) => `₹${value.toFixed(2)}`}
          />
          <Bar 
            dataKey="amount" 
            fill="hsl(var(--primary))"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {data.map((merchant) => (
          <div key={merchant.merchant} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{merchant.merchant}</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">₹{merchant.amount.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">({merchant.count} txn)</span>
              {merchant.trend === 'up' && <TrendingUp className="h-4 w-4 text-destructive" />}
              {merchant.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
