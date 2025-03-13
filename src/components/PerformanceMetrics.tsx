import React from 'react';
import { usePerformanceMetrics, useSportAccuracy } from '../hooks/usePerformanceMetrics';
import { TrendingUp, Target, DollarSign, Percent, AlertCircle } from 'lucide-react';

export function PerformanceMetrics() {
  const { metrics, loading, error } = usePerformanceMetrics();
  const { sportAccuracy, loading: sportLoading } = useSportAccuracy();

  const isLoading = loading || sportLoading;

  if (isLoading) {
    return (
      <div className="animate-pulse p-6 bg-white rounded-lg shadow">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Failed to load performance metrics</span>
        </div>
      </div>
    );
  }

  const highConfidenceMetrics = metrics.find(m => m.prediction_type === 'high_confidence');

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          AI Performance Metrics
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Win Rate</span>
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-700">
              {highConfidenceMetrics?.win_percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">
              {highConfidenceMetrics?.correct_predictions} / {highConfidenceMetrics?.resolved_predictions} correct
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Confidence</span>
              <Percent className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {highConfidenceMetrics?.avg_confidence.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">
              {highConfidenceMetrics?.total_predictions} total predictions
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Profit/Loss</span>
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-700">
              {highConfidenceMetrics?.profit_loss > 0 ? '+' : ''}
              {highConfidenceMetrics?.profit_loss.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              Units (betting performance)
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Current Streak</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {highConfidenceMetrics?.correct_predictions > 0 ? 
                `${highConfidenceMetrics.correct_predictions}W` : 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              Consecutive wins
            </div>
          </div>
        </div>

        {/* Sport-Specific Accuracy */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sport-Specific Accuracy</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Picks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P/L
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sportAccuracy?.map((sport) => (
                  <tr key={sport.sport}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sport.sport.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sport.win_percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sport.total_predictions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sport.avg_confidence}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sport.profit_loss > 0 ? '+' : ''}{sport.profit_loss}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P/L
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric) => (
                  <tr key={metric.prediction_type}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.prediction_type.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.win_percentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.avg_confidence.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.profit_loss > 0 ? '+' : ''}{metric.profit_loss.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
