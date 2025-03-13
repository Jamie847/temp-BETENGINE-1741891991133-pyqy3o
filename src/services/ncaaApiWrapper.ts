import axios from 'axios';
import { API_ENDPOINTS } from '../api/sources';

// Enhanced axios instance with retries and rate limiting
const http = axios.create({
  timeout: 10000,
  headers: { 'Accept': 'application/json' }
});

export async function getTournament() {
  try {
    const response = await http.get(API_ENDPOINTS.BASKETBALL.NCAAB.SCORES, {
      params: { groups: 'tournament' }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament data:', error);
    return null;
  }
}

export async function getGames() {
  try {
    const response = await http.get(API_ENDPOINTS.BASKETBALL.NCAAB.SCORES, {
      params: { limit: 100 }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching games data:', error);
    return null;
  }
}

export async function getTeams() {
  try {
    const response = await http.get(API_ENDPOINTS.BASKETBALL.NCAAB.STANDINGS);
    return response.data;
  } catch (error) {
    console.error('Error fetching teams data:', error);
    return null;
  }
}

// Add error handling and retry logic
export async function fetchWithRetry(endpoint: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await http.get(endpoint);
      return response.data;
    } catch (error) {
      if (i === retries - 1) {
        console.error(`Failed to fetch after ${retries} retries:`, error);
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
