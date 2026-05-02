import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useToastStore } from "../store/useToastStore"
import { useAuthStore } from "../store/useAuthStore"
import { useStatsStore } from "../store/useStatsStore"

import DashboardCards from "../components/DashboardCards"
import WorkflowInput from "../components/WorkflowInput"
import WorkflowResult from "../components/WorkflowResult"

import { createWorkflow } from "../api/workflows"
import { generateWorkflow } from "../api/glm"

function getDisplayName(fullName) {
  if (!fullName) return "there"
  const words = fullName.trim().split(/\s+/)
  if (words.length <= 2) return fullName
  return words.slice(0, 2).join(" ")
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default function Dashboard() {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const profile = useAuthStore((s) => s.profile)
  const activeCount = useStatsStore((s) => s.active)

  const [workflow, setWorkflow] = useState(null)
  const [rawInput, setRawInput] = useState("")
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleGenerate = async (input) => {
    setGenerating(true)
    setWorkflow(null)
    try {
      const wf = await generateWorkflow(input, "auto", "normal")
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
      addToast("success", "Workflow approved and activated — staff notified")
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
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {getGreeting()}, {getDisplayName(profile?.full_name)} —{" "}
            <span className="font-medium text-slate-700">
              {activeCount} active workflow{activeCount === 1 ? "" : "s"} today
            </span>
          </p>
        </div>
        <button
          onClick={() => navigate("/new-workflow")}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Workflow
        </button>
      </div>

      <DashboardCards />

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
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