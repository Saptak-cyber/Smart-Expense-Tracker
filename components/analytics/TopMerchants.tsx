'use client';

import { Store } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TopMerchantsProps {
  data: {
    merchant: string;
    amount: number;
    count: number;
    avgTransaction: number;
  }[];
}

export default function TopMerchants({ data }: TopMerchantsProps) {
  // Color gradient for bars
  const colors = [
    'hsl(var(--primary))',
    'hsl(217, 91%, 60%)',
    'hsl(217, 91%, 65%)',
    'hsl(217, 91%, 70%)',
    'hsl(217, 91%, 75%)',
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.merchant}</p>
          <p className="text-xs text-muted-foreground">Total: ₹{data.amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{data.count} transactions</p>
          <p className="text-xs text-muted-foreground">
            Avg: ₹{data.avgTransaction.toFixed(2)}/txn
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-card rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Top Merchants
        </h3>
        <span className="text-xs text-muted-foreground">By total spending</span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickFormatter={(value) => `₹${value}`}
          />
          <YAxis
            type="category"
            dataKey="merchant"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            width={120}
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
          <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-3 border-t pt-4">
        {data.map((merchant, index) => (
          <div key={merchant.merchant} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: colors[index % colors.length] }}
              >
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium">{merchant.merchant}</p>
                <p className="text-xs text-muted-foreground">{merchant.count} transactions</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">₹{merchant.amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                ₹{merchant.avgTransaction.toFixed(2)}/txn
              </p>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No merchant data available</p>
        </div>
      )}
    </div>
  );
}
