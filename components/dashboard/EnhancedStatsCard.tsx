'use client';

import { Card } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // Percentage change
  icon?: React.ElementType;
  sparklineData?: number[];
  prefix?: string;
  loading?: boolean;
}

export default function EnhancedStatsCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  sparklineData,
  prefix = '',
  loading = false,
}: StatsCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral = trend !== undefined && trend === 0;

  // Simple sparkline path generation
  const generateSparkline = (data: number[]) => {
    if (!data || data.length === 0) return '';

    const width = 100;
    const height = 40;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800/50 p-6 hover:bg-slate-900/70 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all">
              <Icon className="h-5 w-5 text-purple-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
          </div>
        </div>

        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              isPositive
                ? 'bg-green-500/10 text-green-400'
                : isNegative
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-slate-500/10 text-slate-400'
            }`}
          >
            {isPositive && <ArrowUpRight className="h-3 w-3" />}
            {isNegative && <ArrowDownRight className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="h-10 bg-slate-800/50 rounded animate-pulse" />
        ) : (
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">
              {prefix}
              {value}
            </h3>
          </div>
        )}

        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-10">
            <svg
              width="100%"
              height="40"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area under curve */}
              <path
                d={`${generateSparkline(sparklineData)} L 100,40 L 0,40 Z`}
                fill={`url(#gradient-${title})`}
                className="opacity-30"
              />

              {/* Line */}
              <path
                d={generateSparkline(sparklineData)}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-lg"
              />
            </svg>
          </div>
        )}
      </div>
    </Card>
  );
}
