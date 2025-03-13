import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import { API_ENDPOINTS } from './sources';

// Enhanced logging
const logApiCall = (endpoint: string, success: boolean, error?: any) => {
  console.log(`API Call to ${endpoint}:`, {
    timestamp: new Date().toISOString(),
    success,
    error: error?.message
  });
};

// Create rate-limited axios instance
const http = rateLimit(axios.create(), { 
  maxRequests: 5,
  perMilliseconds: 1000
});

async function fetchCBSSportsData(sport: string) {
  try {
    const endpoint = API_ENDPOINTS[sport]?.CBS;
    if (!endpoint) return null;

    logApiCall(endpoint, true);
    const response = await http.get(endpoint);
    return response.data;
  } catch (error) {
    logApiCall('CBS Sports', false, error);
    console.error('Error fetching CBS Sports data:', error);
    return null;
  }
}

export async function fetchMatchData(sport: string, league: string) {
  try {
    const endpoint = API_ENDPOINTS[sport]?.[league];
    if (!endpoint) return null;

    logApiCall(endpoint, true);
    const response = await http.get(endpoint);
    return { events: response.data.events.map((event: any) => ({
      ...event,
      competitions: event.competitions.map((comp: any) => ({
        ...comp,
        competitors: comp.competitors.map((c: any) => ({
          team: {
            id: c.team.id,
            name: c.team.name,
            logo: c.team.logo,
            injuries: []
          },
          records: c.records || [{ summary: '0-0' }],
          score: c.score
        }))
      }))
    })) };
  } catch (error) {
    logApiCall(API_ENDPOINTS[sport]?.[league] || 'unknown', false, error);
    return null;
  }
}

export async function fetchWeatherData(lat: number, lon: number) {
  try {
    const response = await http.get(API_ENDPOINTS.WEATHER, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'temperature_2m,precipitation,windspeed_10m',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

export async function fetchHistoricalData(sport: string, year: number) {
  try {
    switch (sport) {
      case 'NBA': {
        // BallDontLie API for NBA data
        const response = await http.get(`${API_ENDPOINTS.HISTORICAL.NBA}/games`, {
          params: {
            seasons: [year],
            per_page: 100
          }
        });
        return response.data;
      }

      case 'ALL': {
        // TheSportsDB for multiple sports
        const response2 = await http.get(`${API_ENDPOINTS.HISTORICAL.SPORTS_DB}/searchevents.php`, {
          params: {
            s: year
          }
        });
        return response2.data;
      }

      default:
        console.warn(`No direct API for ${sport}, falling back to TheSportsDB`);
        return fetchHistoricalData('ALL', year);
    }
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return null;
  }
}

export async function fetchOddsData(sport: string) {
  try {
    const apiKey = import.meta.env.VITE_ODDS_API_KEY;
    if (!apiKey) {
      console.warn('Odds API key not found. Using mock data.');
      return null;
    }

    const response = await http.get(`${API_ENDPOINTS.ODDS.THE_ODDS_API}/${sport}/odds`, {
      params: {
        apiKey,
        regions: 'us',
        markets: 'h2h,spreads',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching odds data:', error);
    return null;
  }
}
