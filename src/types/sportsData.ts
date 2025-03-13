// Sports Data IO API Types
export interface SportsDataTeam {
  TeamID: number;
  Key: string;
  Active: boolean;
  School: string;
  Name: string;
  ApRank?: number;
  Wins?: number;
  Losses?: number;
  ConferenceWins?: number;
  ConferenceLosses?: number;
  GlobalTeamID: number;
  ConferenceID: number;
  Conference: string;
  TeamLogoUrl?: string;
  ShortDisplayName: string;
  Stadium?: SportsDataStadium;
}

export interface SportsDataGame {
  GameID: number;
  Season: number;
  Status: string;
  Day: string;
  DateTime: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamID: number;
  HomeTeamID: number;
  AwayTeamScore?: number;
  HomeTeamScore?: number;
  Updated: string;
  Period?: string;
  TimeRemainingMinutes?: number;
  TimeRemainingSeconds?: number;
  GlobalGameID: number;
  GlobalAwayTeamID: number;
  GlobalHomeTeamID: number;
  TournamentID?: number;
  Bracket?: string;
  Round?: number;
  AwayTeamSeed?: number;
  HomeTeamSeed?: number;
  TournamentDisplayOrder?: number;
  TournamentDisplayOrderForHomeTeam?: number;
  Stadium?: SportsDataStadium;
  IsClosed: boolean;
}

export interface SportsDataStadium {
  StadiumID: number;
  Active: boolean;
  Name: string;
  Address: string;
  City: string;
  State: string;
  Zip: string;
  Country: string;
  Capacity: number;
  GeoLat?: number;
  GeoLong?: number;
}

export interface SportsDataPlayerGame {
  StatID: number;
  TeamID: number;
  PlayerID: number;
  SeasonType: number;
  Season: number;
  Name: string;
  Team: string;
  Position: string;
  Started: number;
  Minutes: number;
  FieldGoalsMade: number;
  FieldGoalsAttempted: number;
  FieldGoalsPercentage: number;
  ThreePointersMade: number;
  ThreePointersAttempted: number;
  ThreePointersPercentage: number;
  FreeThrowsMade: number;
  FreeThrowsAttempted: number;
  FreeThrowsPercentage: number;
  OffensiveRebounds: number;
  DefensiveRebounds: number;
  Rebounds: number;
  Assists: number;
  Steals: number;
  BlockedShots: number;
  Turnovers: number;
  PersonalFouls: number;
  Points: number;
  Updated: string;
}

export interface SportsDataGameOdds {
  GameOddId: number;
  Sportsbook: string;
  GameId: number;
  Created: string;
  Updated: string;
  HomeMoneyLine?: number;
  AwayMoneyLine?: number;
  HomePointSpread?: number;
  AwayPointSpread?: number;
  HomePointSpreadPayout?: number;
  AwayPointSpreadPayout?: number;
  OverUnder?: number;
  OverPayout?: number;
  UnderPayout?: number;
}
