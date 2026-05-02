// supabase/functions/generate-workflow/index.ts
// Server-side function that takes free-text clinical input, calls Gemini,
// and returns structured workflow JSON in our app's schema shape.
//
// Deployed via: npx supabase functions deploy generate-workflow

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// CORS headers — needed because the function is called from the browser
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// ─── System prompt ───────────────────────────────────────────────────────────
// This tells Gemini what we're doing and how to format the output.
// The schema enforcement happens via responseSchema below — this prompt
// adds the clinical context Gemini needs to make good decisions.

const SYSTEM_PROMPT = `You are a clinical workflow assistant for a small Malaysian clinic. Your job is to read unstructured input (a doctor's note, a WhatsApp message from a receptionist, a brief description of a walk-in patient) and produce a structured workflow that staff can act on.

CONTEXT:
- The clinic handles general consultations, urgent walk-ins, lab orders, specialist referrals, and routine checkups.
- Staff roles: doctor, nurse, lab_tech (lab technician), receptionist, pharmacy, manager, system (for automated steps).
- Inputs may be in English, Bahasa Malaysia, or mixed (rojak). Patient names may include "bin/binti" (Malay) or "a/l/a/p" (Tamil).

YOUR TASK:
For each input, produce:
1. A workflow object with title, type, priority, summary, missingInfo, and patient name.
2. A list of 3–6 steps (tasks) with appropriate roles, statuses, and types.

WORKFLOW TYPES (choose one):
- "appointment" — scheduled visit, routine
- "urgent_walk_in" — unscheduled, needs immediate attention (chest pain, dizziness, severe injury, breathing issues)
- "lab_order" — blood test, FBC, urine, etc.
- "specialist_referral" — referring to a specialist or hospital
- "routine_checkup" — annual physical, well-baby check, etc.
- "follow_up" — follow-up visit after previous treatment

PRIORITY (choose one):
- "urgent" — life-threatening or time-critical (chest pain, severe bleeding, anaphylaxis)
- "high" — important but not life-threatening (high fever in child, suspected fracture)
- "normal" — everything else

PATIENT EXTRACTION:
- Extract the most likely patient name from the input.
- If only a description is given (e.g. "elderly woman, language barrier"), set patient to "Unknown walk-in".
- Preserve full Malay/Tamil/Chinese name structure (e.g. "Ahmad bin Ismail", "Rajan a/l Muthu", "Lim Wei Hong").

MISSING INFO:
- Note any clinically important information the input is missing (IC number, contact, allergies, medical history).
- If nothing important is missing, set this to "None".

STEP FIELDS:
- title: short action ("Triage & vitals", "Notify duty doctor")
- assignee_role: one of doctor, nurse, lab_tech, receptionist, pharmacy, system
- status: "todo" (not started), "in_progress" (currently active or queued), "done" (already complete by the time the workflow is created)
- task_type: appointment, lab, urgent, follow_up, human_review, approval, missing_data, or done
- requires_human_action: true if a person must do something, false if it's automated/system
- is_escalation: true for urgent doctor escalations, otherwise false

GUIDELINES:
- Be concise. Step titles ≤ 60 characters.
- Order steps logically: triage/identification first, then assessment, then action, then follow-up.
- For urgent walk-ins, the FIRST step is always to notify the duty doctor (escalation: true).
- The summary should explain in 1–2 sentences what GLM detected and which template was used.`

// ─── JSON Schema ─────────────────────────────────────────────────────────────
// Gemini will be forced to return JSON matching this exact shape.
// This eliminates all the parsing/validation code we'd otherwise need.

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    type: {
      type: "string",
      enum: ["appointment", "urgent_walk_in", "lab_order", "specialist_referral", "routine_checkup", "follow_up"],
    },
    priority: {
      type: "string",
      enum: ["normal", "high", "urgent"],
    },
    patient: { type: "string" },
    summary: { type: "string" },
    missingInfo: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          assignee_role: {
            type: "string",
            enum: ["doctor", "nurse", "lab_tech", "receptionist", "pharmacy", "manager", "system"],
          },
          status: {
            type: "string",
            enum: ["todo", "in_progress", "done"],
          },
          task_type: {
            type: "string",
            enum: ["appointment", "lab", "urgent", "follow_up", "human_review", "approval", "missing_data", "done"],
          },
          requires_human_action: { type: "boolean" },
          is_escalation: { type: "boolean" },
          time: { type: "string" },  // human-readable estimate, e.g. "5 min", "Post-consult"
        },
        required: ["title", "assignee_role", "status", "task_type", "requires_human_action", "is_escalation"],
      },
    },
  },
  required: ["title", "type", "priority", "patient", "summary", "missingInfo", "steps"],
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured. Run: supabase secrets set GEMINI_API_KEY=...")
    }

    const { input, type, priority } = await req.json()

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Input text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Build the user message — include the user's hints (type/priority) if provided
    let userMessage = `Clinical input: "${input.trim()}"`
    if (type && type !== "auto") userMessage += `\n\nUser indicated workflow type: ${type}`
    if (priority && priority !== "normal") userMessage += `\nUser indicated priority: ${priority}`
    userMessage += "\n\nGenerate the workflow."

    // Call Gemini
   const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.3,           // low temp = more deterministic / consistent
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error("Gemini API error:", geminiResponse.status, errorText)
      throw new Error(`Gemini API returned ${geminiResponse.status}: ${errorText}`)
    }

    const geminiData = await geminiResponse.json()

    // Extract the JSON text from Gemini's response structure
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!responseText) {
      console.error("Unexpected Gemini response shape:", geminiData)
      throw new Error("Gemini returned no usable content")
    }

    // The response is JSON-as-string because of responseMimeType — parse it
    const workflow = JSON.parse(responseText)

    return new Response(
      JSON.stringify(workflow),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("generate-workflow error:", err)
    return new Response(
      JSON.stringify({ error: err.message || "Failed to generate workflow" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})