import { createClient } from "@supabase/supabase-js";
import { fetchProxy } from "./api";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Falta configurar PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (...args) => fetchProxy(...args),
      },
    });
  }

  return client;
}
