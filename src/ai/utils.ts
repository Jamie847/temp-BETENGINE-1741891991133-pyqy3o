import { Team } from '../types';
import dayjs from 'dayjs';

export function normalizeData(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function calculateHistoricalPerformance(team: Team): number {
  // Convert W/L/D record to win percentage
  const [wins, losses] = team.record.split('-').map(Number);
  const totalGames = wins + losses;
  
  if (totalGames === 0) return 0;
  
  // Weight recent form more heavily
  const recentFormScore = team.recentForm
    .slice(0, 5)
    .reduce((score, result, index) => {
      const weight = (5 - index) / 5;
      return score + (result === 'W' ? weight : 0);
    }, 0);

  // Combine historical record with recent form
  return (wins / totalGames * 0.7) + (recentFormScore * 0.3);
}