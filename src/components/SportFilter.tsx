import React from 'react';

interface SportFilterProps {
  selected: string;
  onSelect: (sport: string) => void;
}

export function SportFilter({ selected, onSelect }: SportFilterProps) {
  const sports = [
    { id: 'all', name: 'All Sports' },
    { id: 'ncaab', name: 'NCAA Basketball' },
    { id: 'nfl', name: 'NFL' },
    { id: 'nba', name: 'NBA' },
    { id: 'mlb', name: 'MLB' },
    { id: 'nhl', name: 'NHL' },
  ];

  return (
    <div className="flex space-x-2">
      {sports.map((sport) => (
        <button
          key={sport.id}
          onClick={() => onSelect(sport.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === sport.id
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          {sport.name}
        </button>
      ))}
    </div>
  );
}
