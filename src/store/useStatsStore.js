// src/store/useStatsStore.js
// Shared dashboard stats with realtime auto-refresh.
// One subscription, multiple consumers (Sidebar badges, Dashboard cards, etc.)

import { create } from "zustand"
import { supabase } from "../lib/supabase"
import { getDashboardStats } from "../api/stats"

export const useStatsStore = create((set, get) => ({
  // --- state ---
  active: 0,
  pending_review: 0,
  delayed: 0,
  completed_today: 0,
  unresolved_flags: 0,
  loaded: false,

  // Internal: realtime channel handle so initialize() is idempotent
  _channel: null,

  // --- actions ---

  // Load stats from the database. Safe to call multiple times.
  refresh: async () => {
    try {
      const stats = await getDashboardStats()
      set({ ...stats, loaded: true })
    } catch (err) {
      console.error("Stats refresh failed:", err)
    }
  },

  // Initialize: fetch once + subscribe to realtime. Idempotent — safe to call
  // from multiple components; only the first call sets up the subscription.
  initialize: () => {
    if (get()._channel) return  // already initialized

    // Initial fetch
    get().refresh()

    // Subscribe: any change to workflows or review_flags triggers a refetch.
    // This is simpler than maintaining counts incrementally and the data
    // volume is small enough to not matter.
    const channel = supabase
      .channel("stats:all")
      .on("postgres_changes", { event: "*", schema: "public", table: "workflows" }, () => {
        get().refresh()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "review_flags" }, () => {
        get().refresh()
      })
      .subscribe()

    set({ _channel: channel })
  },

  // Tear down (called from App.jsx on logout, optional)
  cleanup: () => {
    const channel = get()._channel
    if (channel) {
      supabase.removeChannel(channel)
      set({ _channel: null })
    }
  },
}))