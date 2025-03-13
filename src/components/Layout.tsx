import React from 'react';
import { Brain, TrendingUp } from 'lucide-react';
import { NewsBanner } from './NewsBanner';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { metrics } = usePerformanceMetrics();
  const highConfidenceMetrics = metrics?.find(m => m.prediction_type === 'high_confidence');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-white" />
              <span className="ml-2 text-white font-semibold text-lg flex items-center">
                NCAA Basketball
                <span className="ml-2 text-xs bg-indigo-500 px-2 py-1 rounded">
                  BETA
                </span>
              </span>
            </div>
            {highConfidenceMetrics && (
              <div className="flex items-center space-x-4 text-white">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    Prediction Accuracy: {highConfidenceMetrics.win_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm">
                  ({highConfidenceMetrics.correct_predictions}/{highConfidenceMetrics.resolved_predictions} correct)
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
      <NewsBanner />
      {children}
    </div>
  );
}
