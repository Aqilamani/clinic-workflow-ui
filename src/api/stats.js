// src/api/stats.js
// Aggregate counts for sidebar badges and dashboard cards.

import { supabase } from "../lib/supabase"

// All dashboard stats in one batch.
// Returns: { active, pending_review, delayed, completed, completed_today, unresolved_flags }
export async function getDashboardStats() {
  // Workflow status counts — only select the column we actually need
  const { data: workflows, error: wfError } = await supabase
    .from("workflows")
    .select("status")

  if (wfError) throw wfError

  const stats = {
    active: 0,
    pending_review: 0,
    delayed: 0,
    completed: 0,
    completed_today: 0,
  }

  workflows.forEach((wf) => {
    if (stats[wf.status] !== undefined) stats[wf.status]++
    // For now: "completed today" mirrors "completed" total. To make this
    // truly today-only, we'd need to track when the workflow was completed —
    // either add a workflows.completed_at column, or compute from tasks.
    // Leaving as-is keeps the schema unchanged.
    if (wf.status === "completed") {
      stats.completed_today++
    }
  })

  // Unresolved flag count (efficient: head=true means no row data fetched)
  const { count: flagCount, error: flagError } = await supabase
    .from("review_flags")
    .select("*", { count: "exact", head: true })
    .eq("resolved", false)

  if (flagError) throw flagError

  return {
    active: stats.active,
    pending_review: stats.pending_review,
    delayed: stats.delayed,
    completed_today: stats.completed_today,
    unresolved_flags: flagCount || 0,
  }
}