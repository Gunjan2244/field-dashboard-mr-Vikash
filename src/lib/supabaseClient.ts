import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.'
  );
}

// This is the anon/publishable key — it is meant to be public and is safe to
// ship in the client bundle. Actual data access is controlled by Row Level
// Security policies in the database, not by keeping this key secret.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
