// src/api/stats.js
// Aggregate counts and timeseries for the dashboard.

import { supabase } from "../lib/supabase"

// All dashboard stats in one batch.
export async function getDashboardStats() {
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
    if (wf.status === "completed") stats.completed_today++
  })

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

// Daily workflow creation counts for the last N days (inclusive of today).
// Returns: [{ date: 'Mon', dateFull: '2026-04-26', count: 3 }, ...]
export async function getWorkflowTrend(days = 7) {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from("workflows")
    .select("created_at")
    .gte("created_at", startDate.toISOString())

  if (error) throw error

  const buckets = []
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const ymd = d.toISOString().slice(0, 10)
    buckets.push({
      dateFull: ymd,
      date: dayLabels[d.getDay()],
      count: 0,
    })
  }

  data.forEach((wf) => {
    const ymd = wf.created_at.slice(0, 10)
    const bucket = buckets.find((b) => b.dateFull === ymd)
    if (bucket) bucket.count++
  })

  return buckets
}