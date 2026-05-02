// src/lib/supabase.js
// Single Supabase client instance — import this everywhere you need DB access.
// Do NOT create new clients in components; reuse this one so auth state stays in sync.

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file."
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,         // store session in localStorage so refreshes stay logged in
    autoRefreshToken: true,       // auto-refresh JWT before expiry
    detectSessionInUrl: true,     // handle OAuth redirects (future-proofing)
  },
})