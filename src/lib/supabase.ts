import { createClient } from "@supabase/supabase-js";

// Get Supabase credentials from Vite environment
export function getSupabaseConfig() {
  const envUrl = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
  const envKey = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

  const url = (envUrl && envUrl.includes("your-supabase-project") ? "" : envUrl) || "";
  const key = (envKey && envKey.includes("eyJhbGciOi") ? "" : envKey) || "";

  return { url: url.trim(), key: key.trim() };
}

const config = getSupabaseConfig();

// Initialize the Supabase Client
export const supabase =
  config.url && config.key ? createClient(config.url, config.key) : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}
