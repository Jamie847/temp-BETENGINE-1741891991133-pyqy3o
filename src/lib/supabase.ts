import { createClient } from '@supabase/supabase-js/dist/module';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] Initializing client with:', {
  url: supabaseUrl ? 'Present' : 'Missing',
  key: supabaseAnonKey ? 'Present' : 'Missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly');
}

const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Test connection immediately
client.from('teams').select('count').single()
  .then(({ error }) => {
    if (error) {
      console.error('[Supabase] Initial connection test failed:', error);
    } else {
      console.log('[Supabase] Initial connection test successful');
    }
  });

export const supabase = client;
