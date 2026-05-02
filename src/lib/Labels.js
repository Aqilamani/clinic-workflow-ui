// src/lib/labels.js
// Single source of truth for mapping database enum values → display labels.
// Database stores snake_case enums; UI shows human-readable labels.

export const WORKFLOW_STATUS_LABELS = {
  pending_review: "Pending Review",
  active: "Active",
  delayed: "Delayed",
  completed: "Completed",
  cancelled: "Cancelled",
}

export const WORKFLOW_PRIORITY_LABELS = {
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
}

export const TASK_STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Waiting Review",
  done: "Completed",
}

export const TASK_TYPE_LABELS = {
  appointment: "Appointment",
  lab: "Lab",
  urgent: "Urgent",
  urgent_walk_in: "Urgent Walk-In",
  follow_up: "Follow-Up",
  human_review: "Human Review",
  approval: "Approval",
  missing_data: "Missing Data",
  done: "Done",
}

export const FLAG_URGENCY_LABELS = {
  urgent: "Urgent",
  pending: "Pending",
  blocked: "Blocked",
}

// Reverse lookup: display label → enum (used for filter tabs, etc.)
export const WORKFLOW_STATUS_ENUMS = Object.fromEntries(
  Object.entries(WORKFLOW_STATUS_LABELS).map(([k, v]) => [v, k])
)