import React from 'react';
import { Match } from '../types';
import { Brain, TrendingUp, AlertCircle } from 'lucide-react';

interface AIInsightsProps {
  match: Match | null;
}

export function AIInsights({ match }: AIInsightsProps) {
  if (!match) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a match to view AI insights
      </div>
    );
  }

  // This would be replaced with real AI-generated insights
  const insights = [
    {
      type: 'trend',
      icon: TrendingUp,
      title: 'Historical Trend',
      content: 'Home team has won 7 of last 10 matches in similar weather conditions',
    },
    {
      type: 'analysis',
      icon: Brain,
      title: 'AI Analysis',
      content: 'Recent team performance and betting line movement suggest strong value on the home team',
    },
    {
      type: 'alert',
      icon: AlertCircle,
      title: 'Key Consideration',
      content: 'Weather forecast indicates potential impact on passing game efficiency',
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Insights</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-200 transition-colors"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <insight.icon className={`w-5 h-5 ${
                  insight.type === 'trend' ? 'text-green-500' :
                  insight.type === 'analysis' ? 'text-indigo-500' :
                  'text-amber-500'
                }`} />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">{insight.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{insight.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}