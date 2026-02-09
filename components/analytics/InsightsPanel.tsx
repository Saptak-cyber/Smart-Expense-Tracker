'use client';

import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface InsightsPanelProps {
  insights: {
    type: 'positive' | 'negative' | 'warning' | 'info';
    title: string;
    description: string;
  }[];
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingDown className="h-5 w-5 text-green-500" />;
      case 'negative': return <TrendingUp className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Lightbulb className="h-5 w-5 text-primary" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-l-green-500';
      case 'negative': return 'border-l-destructive';
      case 'warning': return 'border-l-yellow-500';
      default: return 'border-l-primary';
    }
  };

  return (
    <div className="p-6 bg-card rounded-lg border">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Insights</h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`p-4 border-l-4 bg-muted/50 rounded-r ${getBorderColor(insight.type)}`}
          >
            <div className="flex items-start space-x-3">
              {getIcon(insight.type)}
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1">{insight.title}</h4>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Not enough data to generate insights
        </div>
      )}
    </div>
  );
}
