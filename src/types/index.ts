// Data Types
export interface Match {
  id: string;
  sport: string;
  homeTeam: Team;
  awayTeam: Team;
  startTime: Date;
  venue: Venue;
  weather: WeatherData;
  odds: BettingOdds;
  predictions: Prediction;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  record: string;
  recentForm: string[];
  injuries: Injury[];
  seed?: number;
  venue?: Venue;
  strengthOfSchedule?: number;
  tournamentHistory?: {
    appearances: number;
    finalFours: number;
    championships: number;
    lastAppearance?: number;
  };
}

export interface Injury {
  playerId: string;
  playerName: string;
  status: 'OUT' | 'QUESTIONABLE' | 'PROBABLE';
  details: string;
  tournament?: {
    round: string;
    region?: string;
    seed?: number;
  };
}

export interface Venue {
  name: string;
  city: string;
  state: string;
  capacity: number;
  surface: string;
  latitude?: number;
  longitude?: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  precipitation: number;
  humidity: number;
}

export interface BettingOdds {
  homeOdds: number;
  awayOdds: number;
  overUnder: number;
  lineMovement: LineMovement[];
}

export interface LineMovement {
  timestamp: Date;
  homeOdds: number;
  awayOdds: number;
}

export interface Prediction {
  homeWinProbability: number;
  awayWinProbability: number;
  confidenceScore: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  name: string;
  impact: number;
  description: string;
}

// High Confidence Pick Types
export interface HighConfidencePick {
  id: string;
  match: Match;
  prediction: Prediction;
  outcome?: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface PickPerformance {
  totalPicks: number;
  wins: number;
  losses: number;
  winPercentage: number;
  averageConfidence: number;
  profitLoss: number;
}

// AI Agent Types
export interface AIAnalysis {
  matchId: string;
  timestamp: Date;
  prediction: Prediction;
  insights: string[];
  dataPoints: AnalysisDataPoint[];
}

export interface AnalysisDataPoint {
  category: string;
  value: number;
  weight: number;
  confidence: number;
}