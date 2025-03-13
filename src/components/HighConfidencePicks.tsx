import React from 'react';
import { HighConfidencePick, PickPerformance } from '../types';
import { TrendingUp, Trophy, DollarSign, Percent } from 'lucide-react';

interface HighConfidencePicksProps {
  picks: HighConfidencePick[];
  performance: PickPerformance;
}

export function HighConfidencePicks({ picks, performance }: HighConfidencePicksProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">High Confidence Picks</h2>
        
        {/* Performance Stats */}
        <div className="flex space-x-4">
          <div className="flex items-center">
            <Trophy className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium">
              {performance.winPercentage.toFixed(1)}% Win Rate
            </span>
          </div>
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium">
              {performance.profitLoss > 0 ? '+' : ''}{performance.profitLoss.toFixed(2)} Units
            </span>
          </div>
          <div className="flex items-center">
            <Percent className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium">
              {performance.averageConfidence.toFixed(1)}% Avg Confidence
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {picks.map((pick) => (
          <div
            key={pick.id}
            className={`bg-white rounded-lg border p-4 ${
              pick.outcome === undefined ? 'border-gray-200' :
              pick.outcome ? 'border-green-200' : 'border-red-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <img
                    src={pick.match.homeTeam.logo}
                    alt={pick.match.homeTeam.name}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="ml-2 font-medium">{pick.match.homeTeam.name}</span>
                  <span className="mx-2 text-gray-500">vs</span>
                  <img
                    src={pick.match.awayTeam.logo}
                    alt={pick.match.awayTeam.name}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="ml-2 font-medium">{pick.match.awayTeam.name}</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-indigo-600 mr-2" />
                <span className="font-semibold text-indigo-600">
                  {pick.prediction.confidenceScore.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                {new Date(pick.match.startTime).toLocaleDateString()}
              </div>
              {pick.outcome !== undefined && (
                <div className={`font-medium ${
                  pick.outcome ? 'text-green-600' : 'text-red-600'
                }`}>
                  {pick.outcome ? 'Won' : 'Lost'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}