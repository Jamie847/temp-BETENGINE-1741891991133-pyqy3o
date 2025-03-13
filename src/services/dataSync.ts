import { supabase } from '@/lib/supabase';
import { fetchMatchData, fetchWeatherData, fetchOddsData, fetchHistoricalData } from '../api/client';
import type { Match, Team, WeatherData, BettingOdds } from '../types';
import { MOCK_DATA } from '../api/mockData';

function sanitizeTeamRecord(record: string): string {
  // Remove any whitespace and validate format
  const cleanRecord = record.replace(/\s/g, '');
  
  // Check if it matches W-L or W-L-T format
  if (/^\d+-\d+(-\d+)?$/.test(cleanRecord)) {
    return cleanRecord;
  }

  return '0-0';
}

function processEventData(event: any) {
  return {
    id: String(event.id),
    sport: String(event.sport),
    competitions: event.competitions.map((comp: any) => ({
      competitors: comp.competitors.map((c: any) => ({
        team: {
          id: String(c.team.id),
          name: String(c.team.name),
          logo: String(c.team.logo),
          injuries: Array.isArray(c.team.injuries) ? c.team.injuries : []
        },
        records: c.records || [{ summary: '0-0' }],
        score: c.score
      })),
      venue: comp.venue ? {
        fullName: comp.venue.fullName,
        address: comp.venue.address ? {
          city: String(comp.venue.address.city),
          state: String(comp.venue.address.state),
          latitude: comp.venue.address.latitude,
          longitude: comp.venue.address.longitude
        } : null
      } : null
    })),
    date: String(event.date),
    status: event.status
  };
}

const processHistoricalGame = (game: any) => ({
  home_team: {
    name: String(game.home_team?.name || ''),
    score: parseInt(String(game.home_team?.score || '0'), 10)
  },
  away_team: {
    name: String(game.away_team?.name || ''),
    score: parseInt(String(game.away_team?.score || '0'), 10)
  },
  date: String(game.date || new Date().toISOString())
});

async function syncHistoricalData(sport: string, year: number) {
  try {
    const rawData = await fetchHistoricalData(sport, year);
    if (!rawData?.games) {
      console.log(`No historical data found for ${sport} year ${year}`);
      return false;
    }

    const games = rawData.games;
    let syncedCount = 0;

    // Process and store historical data
    for (const game of games) {
      if (!game.home_team?.name || !game.away_team?.name) {
        console.log('Skipping game with missing team data');
        continue;
      }

      // Validate date format
      const gameDate = new Date(game.date);
      if (isNaN(gameDate.getTime())) {
        console.log('Skipping game with invalid date:', game.date);
        continue;
      }

      const { data: homeTeam } = await supabase
        .from('teams')
        .upsert({
          name: String(game.home_team.name),
          sport: sport,
          record: '0-0',
          logo_url: 'https://via.placeholder.com/24?text=Team'
        })
        .select()
        .single();

      if (!homeTeam) {
        console.error(`Failed to insert/update home team: ${game.home_team.name}`);
        continue;
      }

      const { data: awayTeam, error: awayError } = await supabase
        .from('teams')
        .upsert({
          name: String(game.away_team.name),
          sport: sport,
          record: '0-0',
          logo_url: 'https://via.placeholder.com/24?text=Team'
        })
        .select()
        .single();

      if (!awayTeam) {
        console.error(`Failed to insert/update away team: ${game.away_team.name}`);
        continue;
      }

      const { data: match, error: matchError } = await supabase
          .from('matches')
          .upsert({
            sport: sport,
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            start_time: gameDate.toISOString(),
            home_score: game.home_team.score,
            away_score: game.away_team.score,
            status: 'finished'
          })
          .select()
          .single();

      if (matchError) {
        console.error('Failed to insert/update match:', matchError);
      } else {
        syncedCount++;
        console.log(`Successfully synced historical match: ${homeTeam.name} vs ${awayTeam.name}`);
      }
    }
    
    return syncedCount > 0;
  } catch (error) {
    console.error('Error syncing historical data:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

export async function syncTeamData(sport: string, league: string) {
  try {
    console.log(`[DataSync] Starting data sync for ${sport} - ${league}`);

    let eventData = await fetchMatchData(sport, league);

    if (!eventData?.events?.length) {
      console.log(`[DataSync] No events found for ${sport} - ${league}, using mock data`);
      const mockEvents = MOCK_DATA.matches.filter(m => m.sport.toUpperCase() === sport.toUpperCase());
      if (mockEvents.length > 0) {
        console.log(`[DataSync] Found ${mockEvents.length} mock events`);
        eventData = { events: mockEvents.map(processEventData) };
      } else {
        console.error(`[DataSync] No mock data available for ${sport}`);
        return;
      }
    }

    // Log Supabase connection status
    const { data: testData, error: testError } = await supabase
      .from('teams')
      .select('count');
    
    if (testError) {
      console.error('[DataSync] Supabase connection error:', testError);
      return;
    }
    console.log('[DataSync] Supabase connection verified');

    console.log(`[DataSync] Processing ${eventData.events.length} events`);
    
    // Special handling for March Madness tournament
    const isMarchMadness = sport === 'NCAAB' && 
      new Date().getMonth() === 2 && // March
      eventData.events.some((e: any) => 
        e.competitions[0]?.notes?.find((n: any) => 
          n.headline?.includes('NCAA Tournament')));

    // Sync historical data for the past 3 years
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 3; year < currentYear; year++) {
      await syncHistoricalData(sport, year);
    }

    for (const event of eventData.events) {
      const processedEvent = processEventData(event);
      
      // Insert home team
      const { data: homeTeam } = await supabase
        .from('teams')
        .upsert({
          name: String(processedEvent.competitions[0].competitors[0].team.name),
          sport: sport,
          logo_url: processedEvent.competitions[0].competitors[0].team.logo || '',
          record: sanitizeTeamRecord(processedEvent.competitions[0].competitors[0].records?.[0]?.summary || '0-0')
        })
        .select()
        .single();

      if (!homeTeam) {
        console.error('[DataSync] Failed to insert/update home team');
        continue;
      }

      // Insert away team
      const { data: awayTeam } = await supabase
        .from('teams')
        .upsert({
          name: String(event.competitions[0].competitors[1].team.name),
          sport: sport,
          logo_url: event.competitions[0].competitors[1].team.logo || '',
          record: event.competitions[0].competitors[1].records?.[0]?.summary?.replace(/\s/g, '') || '0-0'
        })
        .select()
        .single();

      if (!awayTeam) {
        console.error('[DataSync] Failed to insert/update away team');
        continue;
      }

      if (homeTeam && awayTeam) {
        // Insert match
        const { data: match } = await supabase
          .from('matches')
          .upsert({
            sport: sport,
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            start_time: event.date,
            venue_name: event.competitions[0].venue?.fullName,
            venue_city: event.competitions[0].venue?.address?.city,
            venue_state: event.competitions[0].venue?.address?.state
          })
          .select()
          .single();

        if (!match) {
          console.error('[DataSync] Match insert/update returned no data');
          continue;
        }

        // Fetch and insert weather data
        const venue = event.competitions[0].venue;
        if (venue?.address?.latitude && venue?.address?.longitude) {
          const weatherData = await fetchWeatherData(
            venue.address.latitude,
            venue.address.longitude
          ).catch(error => {
            console.error('[DataSync] Weather API error:', error);
            return null;
          });

          if (weatherData?.hourly) {
            const { error: weatherError } = await supabase
              .from('weather_data')
              .upsert({
                match_id: match.id,
                temperature: weatherData.hourly.temperature_2m[0],
                wind_speed: weatherData.hourly.windspeed_10m[0],
                precipitation: weatherData.hourly.precipitation[0]
              });
            
            if (weatherError) {
              console.error('[DataSync] Failed to insert weather data:', weatherError);
            }
          } else {
            console.log('[DataSync] No weather data available for venue:', venue.fullName);
          }
        }

        // Fetch and insert odds data
        const oddsData = await fetchOddsData(sport);
        if (oddsData) {
          const matchOdds = oddsData.find(
            (odd: any) => 
              odd.home_team === homeTeam.name || 
              odd.away_team === awayTeam.name
          );

          if (matchOdds) {
            await supabase
              .from('betting_odds')
              .upsert({
                match_id: match.id,
                home_odds: matchOdds.markets[0].outcomes[0].price,
                away_odds: matchOdds.markets[0].outcomes[1].price,
                over_under: matchOdds.markets[1]?.outcomes[0]?.point || null
              });
          } else {
            console.log('No odds data found for match');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error syncing data:', error);
    console.error('Detailed error:', error instanceof Error ? error.message : 'Unknown error');
  }
}
