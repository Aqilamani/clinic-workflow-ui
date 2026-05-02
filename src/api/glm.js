// src/api/glm.js
// Wrapper around the generate-workflow Edge Function.
// Replaces the mock buildWorkflow() with a real Gemini-powered call.

import { supabase } from "../lib/supabase"

// Generate a workflow from free-text input.
// Returns the same shape as the old buildWorkflow() so existing UI code is unchanged.
//
// Args:
//   input    — required, the free-text clinical note
//   type     — optional hint ('appointment', 'lab', etc.) or 'auto' to let GLM decide
//   priority — optional hint ('normal' | 'high' | 'urgent')
//
// Throws if the function fails or returns an error.
export async function generateWorkflow(input, type = "auto", priority = "normal") {
  if (!input || !input.trim()) {
    throw new Error("Input text is required")
  }

  const { data, error } = await supabase.functions.invoke("generate-workflow", {
    body: { input: input.trim(), type, priority },
  })

  if (error) {
    // Supabase returns a generic FunctionsHttpError; the real error from the function
    // is in the context. Try to surface it.
    const msg = error.context?.error || error.message || "Workflow generation failed"
    throw new Error(msg)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}