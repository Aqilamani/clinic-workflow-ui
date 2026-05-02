// src/api/reviewFlags.js
// Review flags API — flagged workflows requiring human decision.

import { supabase } from "../lib/supabase"

// Fetch all unresolved review flags with workflow + patient context.
export async function getActiveFlags() {
  const { data, error } = await supabase
    .from("review_flags")
    .select(`
      id, urgency, missing_info, ai_recommendation, created_at,
      workflow:workflows (
        id, title, type, priority, status, summary,
        patient:patients ( id, full_name, is_unknown )
      )
    `)
    .eq("resolved", false)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Resolve a flag with a resolution note.
// `note` describes how the flag was resolved (e.g. "Approved AI rec", "Reassigned to Dr. Rahman")
export async function resolveFlag(flagId, note) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("review_flags")
    .update({
      resolved: true,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      resolution_note: note,
    })
    .eq("id", flagId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Count of unresolved flags — for the Sidebar badge.
export async function getActiveFlagCount() {
  const { count, error } = await supabase
    .from("review_flags")
    .select("*", { count: "exact", head: true })
    .eq("resolved", false)

  if (error) throw error
  return count || 0
}

// Subscribe to realtime changes on review_flags.
// Used by the Sidebar to keep the badge count fresh, and by HumanReview itself.
export function subscribeToFlags(callback) {
  const channel = supabase
    .channel("public:review_flags")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "review_flags" },
      (payload) => callback(payload)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}