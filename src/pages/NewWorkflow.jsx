import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useToastStore } from "../store/useToastStore"
import { createWorkflow } from "../api/workflows"
import { generateWorkflow } from "../api/glm"

import WorkflowInput from "../components/WorkflowInput"
import WorkflowResult from "../components/WorkflowResult"

export default function NewWorkflow() {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [workflow, setWorkflow] = useState(null)
  const [rawInput, setRawInput] = useState("")
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleGenerate = async (input, type, priority) => {
    setGenerating(true)
    setWorkflow(null)
    try {
      const wf = await generateWorkflow(input, type, priority)
      setWorkflow(wf)
      setRawInput(input)
      addToast("success", `GLM generated ${wf.steps.length}-step workflow — ready for approval`)
    } catch (err) {
      console.error("generateWorkflow failed:", err)
      addToast("warn", err.message || "Failed to generate workflow")
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async () => {
    if (!workflow) return
    setSaving(true)
    try {
      await createWorkflow(workflow, rawInput)
      addToast("success", "Workflow saved and activated — staff notified")
      setWorkflow(null)
      setRawInput("")
      navigate("/queue")
    } catch (err) {
      console.error("createWorkflow failed:", err)
      addToast("warn", err.message || "Failed to save workflow")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-12">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generate New Workflow</h1>
          <p className="text-sm text-slate-500 mt-1">
            Paste any unstructured input — GLM extracts intent and generates a structured, actionable workflow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 items-start">
        <div className="sticky top-6">
          <WorkflowInput onGenerate={handleGenerate} generating={generating} />
        </div>
        <div className="min-w-0">
          {generating ? (
            <GeneratingPlaceholder />
          ) : (
            <WorkflowResult
              data={workflow}
              onApprove={handleApprove}
              onReset={() => { setWorkflow(null); setRawInput("") }}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Loading placeholder shown while GLM generates ──────────────────────────

function GeneratingPlaceholder() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="animate-pulse">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div className="absolute -inset-2 rounded-2xl border-2 border-blue-300 animate-ping opacity-30" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mt-6">GLM is analyzing…</h3>
      <p className="text-xs text-slate-500 mt-1.5 text-center max-w-xs">
        Extracting clinical intent, identifying patient details, and assembling the workflow steps.
      </p>
      <div className="flex items-center gap-1.5 mt-5">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}