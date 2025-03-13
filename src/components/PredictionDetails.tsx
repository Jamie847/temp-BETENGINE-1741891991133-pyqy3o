import React from 'react';
import { Match } from '../types';
import { TrendingUp, AlertTriangle, ThermometerSun, Trophy, Target } from 'lucide-react';
import { useAIAgent } from '../hooks/useAIAgent';

interface PredictionDetailsProps {
  match: Match | null;
}

const getTournamentIcon = (round: string) => {
  switch (round) {
    case 'Final Four':
    case 'Championship':
      return <Trophy className="w-5 h-5 text-yellow-600" />;
    case 'Elite Eight':
    case 'Sweet 16':
      return <Target className="w-5 h-5 text-purple-600" />;
    default:
      return <TrendingUp className="w-5 h-5 text-indigo-600" />;
  }
};

export function PredictionDetails({ match }: PredictionDetailsProps) {
  const { prediction, isLoading, error } = useAIAgent(match);

  if (!match) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a match to view predictions
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Generating AI prediction...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Prediction Analysis</h2>
      
      {/* Tournament Info */}
      {match.tournament && (
        <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Tournament Round</span>
            {getTournamentIcon(match.tournament.round)}
          </div>
          <div className="text-lg font-medium text-indigo-700">
            {match.tournament.round}
          </div>
          {match.tournament.region && (
            <div className="text-sm text-gray-500">
              {match.tournament.region} Region
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Win Probability */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Win Probability</span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">
            {prediction ? Math.round(prediction.homeWinProbability * 100) : 0}%
          </div>
          <div className="text-sm text-gray-500">
            {match.homeTeam.name}
            {match.homeTeam.seed && ` (${match.homeTeam.seed})`}
          </div>
        </div>

        {/* Weather Impact */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Weather Impact</span>
            <ThermometerSun className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-lg font-medium text-blue-700">
            {match.weather.condition}
          </div>
          <div className="text-sm text-gray-500">
            {match.weather.temperature}°F, {match.weather.windSpeed} mph wind
          </div>
        </div>

        {/* Key Factors */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Risk Factors</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-lg font-medium text-amber-700">
            {match.homeTeam.injuries.length} Injuries
          </div>
          <div className="text-sm text-gray-500">
            {match.homeTeam.injuries[0]?.playerName || 'No major injuries'}
          </div>
        </div>
      </div>

      {/* Prediction Factors */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Key Factors</h3>
        {prediction?.factors.map((factor, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{factor.name}</span>
              <span className={`text-sm font-medium ${
                factor.impact > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {factor.impact > 0 ? '+' : ''}{factor.impact}%
              </span>
            </div>
            <p className="text-sm text-gray-500">{factor.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}