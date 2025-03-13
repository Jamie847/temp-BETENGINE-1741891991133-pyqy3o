import { syncMatchResults } from '@/services/resultSync';
import { generatePredictions } from '@/services/predictionService';
import { syncNCAABasketballData } from '@/services/ncaaDataSync';
import { generateTournamentBracket } from '@/services/bracketPredictor';
import { trackBracketResults } from '@/services/bracketTracker';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

// Monitor health status
let lastSyncTime = 0;
let syncErrors = 0;

async function checkSystemHealth() {
  const currentTime = Date.now();
  const timeSinceLastSync = currentTime - lastSyncTime;
  
  if (timeSinceLastSync > 3600000 * 2) { // 2 hours
    console.error('Alert: Data sync has not run in over 2 hours');
    syncErrors++;
    
    if (syncErrors >= 3) {
      // Attempt system recovery
      console.log('Attempting system recovery...');
      await initialSync();
      syncErrors = 0;
    }
  }
}

// Initial sync on startup
async function initialSync() {
  console.log('[Scheduler] Running initial data sync...');
  let retryCount = 0;
  const maxRetries = 3;
  
  try {
    lastSyncTime = Date.now();
    syncErrors = 0;
    
    // Verify Supabase connection
    const { error: testError } = await supabase
      .from('teams')
      .select('count')
      .single();

    if (testError) {
      throw new Error(`Supabase connection test failed: ${testError.message}`);
    }

    // Sync new match data for all supported sports
    console.log('[Scheduler] Starting NCAA basketball data sync...');
    await syncNCAABasketballData().catch(async (error) => {
      console.error('[Scheduler] Sync failed:', error);
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`[Scheduler] Retrying sync (attempt ${retryCount})`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        return initialSync();
      }
    });
    console.log('Team data sync completed');

    // Generate new predictions
    console.log('Generating initial predictions...');
    await generatePredictions();
    console.log('Initial predictions generated');

    // Sync match results
    console.log('Syncing match results...');
    await syncMatchResults();
    console.log('Match results sync completed');
  } catch (error) {
    console.error('Initial sync error:', error);
    console.error('Detailed error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Run data sync every hour
setInterval(async () => {
  console.log('Running scheduled data sync...');
  
  try {
    // Verify Supabase connection is still active
    const { error: testError } = await supabase
      .from('teams')
      .select('count')
      .single();

    if (testError) {
      throw new Error(`Supabase connection test failed: ${testError.message}`);
    }

    // Sync new match data for all supported sports
    await syncNCAABasketballData();
    console.log('Team data sync completed');

    // Generate new predictions
    await generatePredictions();
    console.log('New predictions generated');

    // Sync match results and resolve predictions
    await syncMatchResults();
    console.log('Match results sync completed');
    
    // Track tournament bracket results
    await trackBracketResults();
    console.log('Tournament bracket results tracked');
    
    // Generate tournament bracket during March Madness
    const today = new Date();
    if (today.getMonth() === 2 && today.getDate() === 14) { // Selection Sunday
      await generateTournamentBracket(today.getFullYear());
      console.log('Tournament bracket predictions generated');
    }
  } catch (error) {
    console.error('Scheduled sync error:', error);
    console.error('Detailed error:', error instanceof Error ? error.message : 'Unknown error');
  }
}, 60 * 60 * 1000); // 1 hour

// Trigger initial sync immediately
initialSync()
  .then(() => console.log('Initial sync completed'))
  .catch(console.error);

// Log when the scheduler starts
console.log('Sports AI Predictor scheduler started');
console.log('Environment:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
});
