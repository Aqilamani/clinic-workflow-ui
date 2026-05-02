// src/store/useAuthStore.js
// Global auth state: session, user, profile.
// Initialized once in App.jsx; components subscribe to whatever they need.

import { create } from "zustand"
import { supabase } from "../lib/supabase"

export const useAuthStore = create((set, get) => ({
  // --- state ---
  session: null,        // raw Supabase session (contains JWT, expiry, etc.)
  user: null,           // auth.users row (id, email, created_at, ...)
  profile: null,        // public.profiles row (full_name, role, notif prefs, ...)
  loading: true,        // true while we restore session on first load

  // --- actions ---

  // Called once at app startup. Restores session from localStorage
  // and listens for future auth changes (login, logout, token refresh).
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      const profile = await fetchProfile(session.user.id)
      set({ session, user: session.user, profile, loading: false })
    } else {
      set({ session: null, user: null, profile: null, loading: false })
    }

    // Subscribe to future auth changes (this fires on login, logout, token refresh, etc.)
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        const profile = await fetchProfile(newSession.user.id)
        set({ session: newSession, user: newSession.user, profile })
      } else {
        set({ session: null, user: null, profile: null })
      }
    })
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // The handle_new_user() trigger reads these from raw_user_meta_data
        // and uses them to populate the new public.profiles row.
        data: { full_name: fullName, role: "staff" },
      },
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Update local profile cache after a profile edit (avoids a re-fetch)
  setProfile: (profile) => set({ profile }),
}))

// Helper: load profile row for the given user id
async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Failed to fetch profile:", error)
    return null
  }
  return data
}