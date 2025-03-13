import * as tf from '@tensorflow/tfjs';
import { supabase } from '../lib/supabase';
import { Match, Team, WeatherData, BettingOdds, Prediction, PredictionFactor, HighConfidencePick, PickPerformance } from '../types';
import { normalizeData, calculateHistoricalPerformance } from './utils';

export class AIAgent {
  private model: tf.LayersModel | null = null;
  private highConfidencePicks: HighConfidencePick[] = [];
  private readonly CONFIDENCE_THRESHOLD = 85;
  private readonly TOURNAMENT_WEIGHT = 1.25; // Increase importance of tournament-specific factors
  
  constructor() {
    this.initializeModel();
  }

  public getHighConfidencePicks(): HighConfidencePick[] {
    return this.highConfidencePicks
      .sort((a, b) => b.prediction.confidenceScore - a.prediction.confidenceScore);
  }

  public getPerformanceMetrics(): PickPerformance {
    const resolvedPicks = this.highConfidencePicks.filter(pick => pick.outcome !== undefined);
    const wins = resolvedPicks.filter(pick => pick.outcome === true).length;
    
    return {
      totalPicks: resolvedPicks.length,
      wins,
      losses: resolvedPicks.length - wins,
      winPercentage: resolvedPicks.length > 0 ? (wins / resolvedPicks.length) * 100 : 0,
      averageConfidence: resolvedPicks.length > 0 
        ? resolvedPicks.reduce((sum, pick) => sum + pick.prediction.confidenceScore, 0) / resolvedPicks.length 
        : 0,
      profitLoss: resolvedPicks.reduce((sum, pick) => {
        const odds = pick.match.odds.homeOdds;
        return sum + (pick.outcome ? odds - 1 : -1);
      }, 0)
    };
  }

  private async initializeModel() {
    // Create a sequential model for prediction
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [18], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.1 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }

  private async generatePredictionFactors(
    match: Match,
    prediction: number
  ): Promise<PredictionFactor[]> {
    const factors: PredictionFactor[] = [];
    const isTournament = match.tournament?.round !== undefined;
    const weight = isTournament ? this.TOURNAMENT_WEIGHT : 1;

    // Historical head-to-head analysis
    const historicalMatches = await this.fetchHistoricalMatchups(match);
    if (historicalMatches?.length > 0) {
      const homeWins = historicalMatches.filter(m => 
        m.home_team_id === match.homeTeam.id && m.home_score > m.away_score ||
        m.away_team_id === match.homeTeam.id && m.away_score > m.home_score
      ).length;
      
      const winRate = homeWins / historicalMatches.length;
      const impact = Math.round((winRate - 0.5) * 20 * weight);
      
      factors.push({
        name: 'Historical Matchups',
        impact,
        description: `${match.homeTeam.name} has won ${homeWins} of ${historicalMatches.length} previous matchups`
      });
    }

    // Tournament-specific factors
    if (isTournament) {
      const seedDiff = (match.awayTeam.seed || 8) - (match.homeTeam.seed || 8);
      factors.push({
        name: 'Seed Advantage',
        impact: Math.round(seedDiff * 1.5),
        description: `${match.homeTeam.name} is seeded ${Math.abs(seedDiff)} spots ${seedDiff > 0 ? 'higher' : 'lower'}`
      });

      // Tournament experience
      const expDiff = (match.homeTeam.tournamentHistory?.appearances || 0) -
                     (match.awayTeam.tournamentHistory?.appearances || 0);
      if (Math.abs(expDiff) > 2) {
        factors.push({
          name: 'Tournament Experience',
          impact: Math.round(expDiff * 0.5),
          description: `${match.homeTeam.name} has ${Math.abs(expDiff)} more tournament appearances`
        });
      }

      // Strength of Schedule impact
      const sosDiff = (match.homeTeam.strengthOfSchedule || 0) -
                     (match.awayTeam.strengthOfSchedule || 0);
      factors.push({
        name: 'Schedule Strength',
        impact: Math.round(sosDiff * 10),
        description: `${match.homeTeam.name} played a ${sosDiff > 0 ? 'stronger' : 'weaker'} schedule`
      });
    }

    // Weather impact analysis
    if (match.weather.windSpeed > 15) {
      factors.push({
        name: 'High Wind Impact',
        impact: -5,
        description: 'Strong winds may affect shooting performance'
      });
    }

    // Injury analysis
    const homeInjuryImpact = -(match.homeTeam.injuries.length * 2);
    if (homeInjuryImpact !== 0) {
      factors.push({
        name: 'Home Team Injuries',
        impact: homeInjuryImpact,
        description: `${match.homeTeam.injuries.length} key players unavailable`
      });
    }

    // Historical matchup analysis
    const historicalAdvantage = calculateHistoricalPerformance(match.homeTeam) -
                               calculateHistoricalPerformance(match.awayTeam);
    factors.push({
      name: 'Historical Performance',
      impact: Math.round(historicalAdvantage * 10 * weight),
      description: 'Based on past head-to-head matchups and recent form'
    });

    // Betting market analysis
    const marketConfidence = ((1 / match.odds.homeOdds) * 100) - 50;
    factors.push({
      name: 'Market Sentiment',
      impact: Math.round(marketConfidence),
      description: 'Derived from betting market movements and odds'
    });

    return factors;
  }

  private async fetchHistoricalMatchups(match: Match): Promise<any[]> {
    try {
      if (!match?.homeTeam?.id || !match?.awayTeam?.id) {
        console.log('Missing team IDs for historical matchup lookup');
        return [];
      }

      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*)
        `)
        .or(`and(home_team_id.eq.${match.homeTeam.id},away_team_id.eq.${match.awayTeam.id}),and(home_team_id.eq.${match.awayTeam.id},away_team_id.eq.${match.homeTeam.id})`)
        .lt('start_time', match.startTime)
        .order('start_time', { ascending: false })
        .limit(10);
      
      return data || [];
    } catch (error) {
      console.error('Error fetching historical matchups:', error);
      return [];
    }
  }

  private prepareInputFeatures(match: Match): tf.Tensor {
    // Include historical matchup features
    const historicalFeatures = this.calculateHistoricalMatchupFeatures(match);
    const playerFeatures = this.calculatePlayerFeatures(match);
    const tournamentFeatures = this.calculateTournamentFeatures(match);
    
    const features = [
      // Team performance features
      normalizeData(calculateHistoricalPerformance(match.homeTeam)),
      normalizeData(calculateHistoricalPerformance(match.awayTeam)),
      
      // Player performance features
      playerFeatures.homeTeamOffense,
      playerFeatures.homeTeamDefense,
      playerFeatures.awayTeamOffense,
      playerFeatures.awayTeamDefense,
      playerFeatures.homeTeamExperience,
      playerFeatures.awayTeamExperience,
      
      // Tournament-specific features
      tournamentFeatures.homeSeedStrength,
      tournamentFeatures.awaySeedStrength,
      tournamentFeatures.homeTournamentExperience,
      tournamentFeatures.awayTournamentExperience,
      tournamentFeatures.homeSOSRating,
      tournamentFeatures.awaySOSRating,
      
      // Historical matchup features
      historicalFeatures.headToHeadWinRate,
      historicalFeatures.recentFormAgainstOpponent,
      historicalFeatures.neutralSiteWinRate,
      historicalFeatures.tournamentMatchupHistory,
      
      // Weather impact
      normalizeData(match.weather.temperature / 100),
      normalizeData(match.weather.windSpeed / 30),
      normalizeData(match.weather.precipitation),
      
      // Betting market features
      normalizeData(match.odds.homeOdds),
      normalizeData(match.odds.awayOdds),
      normalizeData(match.odds.line || 0),
      
      // Injury impact
      normalizeData(match.homeTeam.injuries.length / 5),
      normalizeData(match.awayTeam.injuries.length / 5),
      
      // Venue/Tournament factors
      this.calculateVenueAdvantage(match),
      
      // Recent form (last 5 games)
      this.calculateRecentFormScore(match.homeTeam),
      this.calculateRecentFormScore(match.awayTeam)
    ];

    return tf.tensor2d([features]);
  }

  private calculatePlayerFeatures(match: Match): {
    homeTeamOffense: number;
    homeTeamDefense: number;
    awayTeamOffense: number;
    awayTeamDefense: number;
    homeTeamExperience: number;
    awayTeamExperience: number;
  } {
    const homeStats = match.homeTeam.playerStats || [];
    const awayStats = match.awayTeam.playerStats || [];
    
    return {
      homeTeamOffense: normalizeData(
        homeStats.reduce((sum, player) => 
          sum + (player.points_per_game || 0), 0) / Math.max(homeStats.length, 1)
      ),
      homeTeamDefense: normalizeData(
        homeStats.reduce((sum, player) => 
          sum + (player.steals_per_game || 0) + (player.blocks_per_game || 0), 0) / Math.max(homeStats.length, 1)
      ),
      awayTeamOffense: normalizeData(
        awayStats.reduce((sum, player) => 
          sum + (player.points_per_game || 0), 0) / Math.max(awayStats.length, 1)
      ),
      awayTeamDefense: normalizeData(
        awayStats.reduce((sum, player) => 
          sum + (player.steals_per_game || 0) + (player.blocks_per_game || 0), 0) / Math.max(awayStats.length, 1)
      ),
      homeTeamExperience: normalizeData(
        homeStats.reduce((sum, player) => 
          sum + (player.games_played || 0), 0) / Math.max(homeStats.length, 1) / 30
      ),
      awayTeamExperience: normalizeData(
        awayStats.reduce((sum, player) => 
          sum + (player.games_played || 0), 0) / Math.max(awayStats.length, 1) / 30
      )
    };
  }
  private calculateTournamentFeatures(match: Match) {
    const isTournament = match.tournament?.round !== undefined;
    
    // Calculate seed strength (lower seeds are better)
    const homeSeedStrength = match.homeTeam.seed ? 
      (17 - match.homeTeam.seed) / 16 : 0.5;
    const awaySeedStrength = match.awayTeam.seed ? 
      (17 - match.awayTeam.seed) / 16 : 0.5;
    
    // Calculate tournament experience based on historical data
    const homeTournamentExperience = match.homeTeam.tournamentHistory?.appearances || 0;
    const awayTournamentExperience = match.awayTeam.tournamentHistory?.appearances || 0;
    
    // Strength of Schedule ratings
    const homeSOSRating = match.homeTeam.strengthOfSchedule || 0.5;
    const awaySOSRating = match.awayTeam.strengthOfSchedule || 0.5;
    
    return {
      homeSeedStrength: isTournament ? homeSeedStrength : 0.5,
      awaySeedStrength: isTournament ? awaySeedStrength : 0.5,
      homeTournamentExperience: normalizeData(homeTournamentExperience / 10),
      awayTournamentExperience: normalizeData(awayTournamentExperience / 10),
      homeSOSRating: normalizeData(homeSOSRating),
      awaySOSRating: normalizeData(awaySOSRating)
    };
  }

  private calculateVenueAdvantage(match: Match): number {
    if (!match.venue) return 0;
    
    // Check if it's a tournament game
    if (match.tournament?.round) {
      // Calculate distance from team's home venue to tournament venue
      const homeDistance = this.calculateVenueDistance(
        match.homeTeam.venue,
        match.venue
      );
      const awayDistance = this.calculateVenueDistance(
        match.awayTeam.venue,
        match.venue
      );
      
      // Return normalized advantage based on relative distances
      return normalizeData((awayDistance - homeDistance) / 1000);
    }
    
    // Regular season game
    return match.venue.name === match.homeTeam.venue?.name ? 1 : 0;
  }

  private calculateVenueDistance(venue1: Venue, venue2: Venue): number {
    if (!venue1?.latitude || !venue1?.longitude || 
        !venue2?.latitude || !venue2?.longitude) {
      return 0;
    }
    
    // Haversine formula for calculating distance between coordinates
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(venue2.latitude - venue1.latitude);
    const dLon = this.toRad(venue2.longitude - venue1.longitude);
    const lat1 = this.toRad(venue1.latitude);
    const lat2 = this.toRad(venue2.latitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * 
              Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  private async calculateHistoricalMatchupFeatures(match: Match) {
    const historicalMatches = await this.fetchHistoricalMatchups(match);
    
    // Calculate head-to-head win rate
    const headToHeadWinRate = historicalMatches.length > 0 
      ? historicalMatches.filter(m => 
          (m.home_team_id === match.homeTeam.id && m.home_score > m.away_score) ||
          (m.away_team_id === match.homeTeam.id && m.away_score > m.home_score)
        ).length / historicalMatches.length
      : 0.5;
    
    // Calculate recent form against this specific opponent
    const recentFormAgainstOpponent = historicalMatches
      .slice(0, 5)
      .reduce((score, m, index) => {
        const weight = (5 - index) / 5;
        const isWin = (m.home_team_id === match.homeTeam.id && m.home_score > m.away_score) ||
                     (m.away_team_id === match.homeTeam.id && m.away_score > m.home_score);
        return score + (isWin ? weight : 0);
      }, 0) / 5;

    return {
      headToHeadWinRate: normalizeData(headToHeadWinRate),
      recentFormAgainstOpponent: normalizeData(recentFormAgainstOpponent)
    };
  }

  private calculateRecentFormScore(team: Team): number {
    return team.recentForm
      .slice(0, 5)
      .reduce((score, result, index) => {
        const weight = (5 - index) / 5; // More recent games have higher weight
        return score + (result === 'W' ? weight : 0);
      }, 0) / 5;
  }

  public async predictMatch(match: Match): Promise<Prediction> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const input = this.prepareInputFeatures(match);
    
    // Generate prediction
    const prediction = await this.model.predict(input) as tf.Tensor;
    const homeWinProbability = (await prediction.data())[0];
    const confidenceScore = Math.abs((homeWinProbability - 0.5) * 2) * 100;
    
    // Track high confidence picks
    if (confidenceScore >= this.CONFIDENCE_THRESHOLD) {
      this.highConfidencePicks.push({
        id: crypto.randomUUID(),
        match,
        prediction: {
          homeWinProbability,
          awayWinProbability: 1 - homeWinProbability,
          confidenceScore,
          factors: await this.generatePredictionFactors(match, homeWinProbability)
        },
        createdAt: new Date()
      });
    }

    // Generate factors affecting the prediction
    const factors = await this.generatePredictionFactors(match, homeWinProbability);

    return {
      homeWinProbability,
      awayWinProbability: 1 - homeWinProbability,
      confidenceScore,
      factors
    };
  }

  public async updateModel(match: Match, actualOutcome: boolean): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const input = this.prepareInputFeatures(match);
    const label = tf.tensor2d([[actualOutcome ? 1 : 0]]);

    // Update model with new data
    await this.model.fit(input, label, {
      epochs: 1,
      verbose: 0
    });

    // Cleanup tensors
    input.dispose();
    label.dispose();
    
    // Update high confidence pick outcome if applicable
    const highConfidencePick = this.highConfidencePicks.find(
      pick => pick.match.id === match.id && !pick.outcome
    );
    
    if (highConfidencePick) {
      highConfidencePick.outcome = actualOutcome;
      highConfidencePick.resolvedAt = new Date();
    }
  }
}
