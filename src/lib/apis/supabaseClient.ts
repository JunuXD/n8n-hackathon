// src/lib/supabaseClient.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_REACT_APP_SUPABASE_URL ||
  import.meta.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY ||
  import.meta.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL or Anon Key is missing in environment variables"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
