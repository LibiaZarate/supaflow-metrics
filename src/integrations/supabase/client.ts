// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rvnjnqbsjhcopytckqjh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bmpucWJzamhjb3B5dGNrcWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDEwMjQsImV4cCI6MjA2ODc3NzAyNH0.eVRgMRpcDpwD8ICwJ52SMuOzyi0ZN6o-tLwOL7cIlBE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});