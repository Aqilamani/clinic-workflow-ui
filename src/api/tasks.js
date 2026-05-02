// src/api/tasks.js
// Tasks API — reads, status updates, and realtime subscription helper.

import { supabase } from "../lib/supabase"

// Fetch all tasks with workflow + patient + assignee context.
// "All tasks" per the user's request — no workflow status filter.
export async function getAllTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id, title, description, status, task_type,
      assignee_role, order_index, due_at, requires_human_action, is_escalation,
      created_at,
      assignee:profiles!tasks_assignee_id_fkey ( id, full_name, role ),
      workflow:workflows (
        id, title, type, priority, status,
        patient:patients ( full_name )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Update a task's status. Returns the updated row.
// The handle_task_completion trigger auto-stamps completed_at when status='done'.
export async function updateTaskStatus(taskId, newStatus) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", taskId)
    .select(`
      id, title, description, status, task_type,
      assignee_role, order_index, due_at, requires_human_action, is_escalation,
      created_at,
      assignee:profiles!tasks_assignee_id_fkey ( id, full_name, role ),
      workflow:workflows (
        id, title, type, priority, status,
        patient:patients ( full_name )
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Subscribe to realtime task changes.
// `callback` receives ({ eventType, new, old }) for each INSERT/UPDATE/DELETE.
// Returns an unsubscribe function — call it on component unmount.
//
// Usage:
//   useEffect(() => {
//     const unsub = subscribeToTasks((change) => { ... })
//     return unsub
//   }, [])
export function subscribeToTasks(callback) {
  const channel = supabase
    .channel("public:tasks")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks" },
      (payload) => callback(payload)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}