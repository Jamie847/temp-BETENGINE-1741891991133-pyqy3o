import React from 'react';
import { Match } from '../types';
import { Calendar, MapPin } from 'lucide-react';
import { useMatches } from '../hooks/useSupabase';
import { MOCK_DATA } from '../api/mockData';

interface MatchListProps {
  selectedSport: string;
  selectedMatch: Match | null;
  onSelectMatch: (match: Match) => void;
}

export function MatchList({ selectedSport, selectedMatch, onSelectMatch }: MatchListProps) {
  const { matches, loading, error } = useMatches(selectedSport);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !matches?.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-600">
        <p className="mb-4">Using sample data while loading matches...</p>
        {MOCK_DATA.matches.map((match) => (
          <div 
            key={match.id} 
            className="w-full px-4 py-3 border-b border-gray-200 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {match.competitions[0]?.competitors[0]?.team?.name || 'TBD'}
                </span>
                <span className="text-gray-500">vs</span>
                <span className="font-medium">
                  {match.competitions[0]?.competitors[1]?.team?.name || 'TBD'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Matches</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {matches.map((match) => (
          <button
            key={match?.id || crypto.randomUUID()}
            onClick={() => onSelectMatch(match)}
            className={`w-full px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
              selectedMatch?.id === match.id ? 'bg-indigo-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <img
                    src={match.homeTeam?.logo || 'https://via.placeholder.com/24?text=Team'}
                    alt={match.homeTeam?.name || 'Home Team'}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/24?text=Team';
                    }}
                  />
                  <span className="font-medium">{match.homeTeam?.name || 'TBD'}</span>
                  <span className="text-gray-500">vs</span>
                  <img
                    src={match.awayTeam?.logo || 'https://via.placeholder.com/24?text=Team'}
                    alt={match.awayTeam?.name || 'Away Team'}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/24?text=Team';
                    }}
                  />
                  <span className="font-medium">{match.awayTeam?.name || 'TBD'}</span>
                </div>
                
                <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {match.startTime ? new Date(match.startTime).toLocaleDateString() : 'TBD'}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {match.venue?.name || 'TBD'}
                  </div>
                </div>
              </div>
              
              <div className="ml-4 flex flex-col items-end">
                <div className="text-lg font-semibold text-indigo-600">
                  {Math.round(match.predictions?.confidenceScore || 0)}%
                </div>
                <div className="text-sm text-gray-500">Confidence</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
