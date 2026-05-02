// src/api/workflows.js
// Query wrappers for workflows.

import { supabase } from "../lib/supabase"

// Fetch all workflows with patient + task progress.
export async function getWorkflows() {
  const { data, error } = await supabase
    .from("workflows")
    .select(`
      id, title, type, status, priority, summary, created_at,
      patient:patients ( full_name ),
      tasks ( id, status )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data.map((wf) => ({
    ...wf,
    total_tasks: wf.tasks?.length || 0,
    completed_tasks: wf.tasks?.filter((t) => t.status === "done").length || 0,
  }))
}

// Fetch a single workflow with all its tasks (ordered).
export async function getWorkflowById(id) {
  const { data, error } = await supabase
    .from("workflows")
    .select(`
      *,
      patient:patients ( id, full_name, ic_number, phone, allergies ),
      tasks ( * )
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  if (data?.tasks) data.tasks.sort((a, b) => a.order_index - b.order_index)
  return data
}

// Approve a workflow: pending_review → active.
export async function approveWorkflow(id) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("workflows")
    .update({
      status: "active",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Workflow status counts (for sidebar badges, dashboard cards).
export async function getWorkflowCounts() {
  const { data, error } = await supabase.from("workflows").select("status")
  if (error) throw error

  const counts = { active: 0, pending_review: 0, delayed: 0, completed: 0, cancelled: 0 }
  data.forEach((w) => { if (counts[w.status] !== undefined) counts[w.status]++ })
  return counts
}

// Create a workflow + tasks (+ optional review flag) atomically via RPC.
//
// Input shape (matches what buildWorkflow returns):
//   workflow: { title, type, status, priority, summary, raw_input, missingInfo, patient, steps }
//
// Returns the new workflow's UUID.
export async function createWorkflow(generated, rawInput) {
  // Build a review flag if GLM detected missing info worth flagging
  const hasMissingInfo = generated.missingInfo && generated.missingInfo !== "None"
  const reviewFlag = hasMissingInfo
    ? {
        urgency: generated.priority === "urgent" ? "urgent" : "pending",
        missing_info: generated.missingInfo,
        ai_recommendation:
          generated.summary || "GLM recommends manual review before proceeding.",
      }
    : null

  const { data, error } = await supabase.rpc("create_workflow_from_glm", {
    p_patient_name: generated.patient || null,
    p_workflow: {
      title: generated.title,
      type: generated.type,
      status: generated.status || "pending_review",
      priority: generated.priority || "normal",
      summary: generated.summary,
      raw_input: rawInput,
      missing_info: generated.missingInfo,
    },
    p_tasks: generated.steps.map((s, i) => ({
      title: s.title,
      description: s.description || null,
      status: s.status || "todo",
      task_type: s.task_type,
      assignee_role: s.assignee_role,
      order_index: i + 1,
      requires_human_action: !!s.requires_human_action,
      is_escalation: !!s.is_escalation,
    })),
    p_review_flag: reviewFlag,
  })

  if (error) throw error
  return data  // the new workflow UUID
}