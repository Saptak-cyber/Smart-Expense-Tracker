'use client';

import { supabase } from '@/lib/supabase';
import { AlertTriangle, Lightbulb, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Insight {
  type: 'positive' | 'negative' | 'warning' | 'info';
  title: string;
  description: string;
}

export default function InsightCard() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsight();
  }, []);

  const loadInsight = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch analytics data to get insights
      const response = await fetch('/api/analytics/detailed?months=1', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Get the most important insight (prioritize negative, then warning, then positive)
        const insights = data.insights || [];
        const priorityInsight =
          insights.find((i: Insight) => i.type === 'negative') ||
          insights.find((i: Insight) => i.type === 'warning') ||
          insights.find((i: Insight) => i.type === 'positive') ||
          insights[0];

        setInsight(priorityInsight || null);
      }
    } catch (error) {
      console.error('Failed to load insight:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    if (!insight) return <Lightbulb className="h-6 w-6" />;
    
    switch (insight.type) {
      case 'positive':
        return <TrendingDown className="h-6 w-6" />;
      case 'negative':
        return <TrendingUp className="h-6 w-6" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6" />;
      default:
        return <Sparkles className="h-6 w-6" />;
    }
  };

  const getGradient = () => {
    if (!insight) return 'from-indigo-500 to-purple-600';
    
    switch (insight.type) {
      case 'positive':
        return 'from-green-500 to-emerald-600';
      case 'negative':
        return 'from-red-500 to-rose-600';
      case 'warning':
        return 'from-yellow-500 to-orange-600';
      default:
        return 'from-indigo-500 to-purple-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white animate-pulse">
        <div className="h-6 bg-white/20 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-white/20 rounded w-2/3"></div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Smart Insight
            </h3>
            <p className="text-slate-100">
              Add more expenses to get personalized insights about your spending patterns.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r ${getGradient()} rounded-xl p-6 text-white`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            {getIcon()}
            {insight.title}
          </h3>
          <p className="text-white/90 leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}
