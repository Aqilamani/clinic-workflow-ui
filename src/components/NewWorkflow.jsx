import { useState } from "react"
import { useNavigate } from "react-router-dom" // 1. Import Router hook
import { useToastStore } from "../store/useToastStore" // 2. Import Zustand store

import WorkflowInput from "../components/WorkflowInput"
import WorkflowResult from "../components/WorkflowResult"

// AI Logic (Kept exactly as you wrote it)
function buildWorkflow(input, type, priority) {
  const lower = input.toLowerCase()
  const isUrgent = lower.includes("chest") || lower.includes("dizziness") || priority === "urgent"
  const isLab = lower.includes("lab") || lower.includes("fbc") || type === "lab"

  if (isLab) {
    return {
      title: "Lab Order Workflow",
      status: "Pending Approval",
      patient: "As specified in input",
      urgency: priority === "urgent" ? "High" : "Standard",
      missingInfo: "None",
      summary: "GLM interpreted a lab order request and generated a complete sample collection → processing → results workflow.",
      steps: [
        { title: "Confirm patient identity & generate lab request form", role: "System", time: "Immediate", type: "done" },
        { title: "Collect blood/sample from patient", role: "Lab Technician", time: "30 min", type: "active" },
        { title: "Process requested tests", role: "Lab Team", time: "45–90 min", type: "active" },
        { title: "Enter results — auto-flag critical values", role: "Lab Tech", time: "Post-processing", type: "active" },
        { title: "Notify ordering doctor", role: "System", time: "Immediate", type: "active" },
        { title: "Schedule follow-up", role: "Receptionist", time: "After review", type: "human", escalation: true },
      ],
    }
  }

  if (isUrgent) {
    return {
      title: "Urgent Walk-In Workflow",
      status: "Pending Approval",
      patient: "Walk-In (details pending)",
      urgency: "High",
      missingInfo: "Patient IC, contact number, medical history",
      summary: "GLM detected urgent clinical flags. URGENT_WALK_IN template applied. Immediate doctor escalation required — patient detail collection to proceed in parallel.",
      steps: [
        { title: "URGENT: Notify duty doctor immediately", role: "System → Doctor", time: "0 min", type: "urgent", escalation: true },
        { title: "Triage & vitals — BP, O2, pulse, temp", role: "Nurse", time: "5 min", type: "active" },
        { title: "Collect patient details (parallel track)", role: "Receptionist", time: "10 min", type: "active", gap: "Missing: IC, contact, allergies" },
        { title: "Doctor consultation", role: "Doctor", time: "15 min", type: "human", escalation: true },
        { title: "Determine next action: ECG / Lab / Referral", role: "Doctor", time: "Post-consult", type: "human", escalation: true },
      ],
    }
  }

  return {
    title: "Clinic Appointment Workflow",
    status: "Pending Approval",
    patient: "As specified in input",
    urgency: "Standard",
    missingInfo: "None",
    summary: "GLM interpreted an appointment request and generated a standard clinic workflow with check-in, triage, consultation, and discharge steps.",
    steps: [
      { title: "Confirm appointment slot", role: "Receptionist", time: "Immediate", type: "human", escalation: true },
      { title: "Send confirmation to patient/guardian", role: "System", time: "5 min", type: "active" },
      { title: "Patient check-in & triage on visit day", role: "Nurse", time: "Visit day", type: "active" },
      { title: "Doctor consultation", role: "Doctor", time: "15 min post-triage", type: "human", escalation: true },
      { title: "Prescription / discharge / referral", role: "Doctor + Pharmacy", time: "Post-consult", type: "active" },
    ],
  }
}

// 3. Remove all props here!
export default function NewWorkflow() {
  // 4. Initialize our global hooks
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)
  
  const [workflow, setWorkflow] = useState(null)

  const handleGenerate = (input, type, priority) => {
    const wf = buildWorkflow(input, type, priority)
    setWorkflow(wf)
    // 5. Cleaned up the toast call
    addToast("success", `Workflow generated — ${wf.steps.length} steps, ready for approval`)
  }

  const handleApprove = () => {
    setWorkflow(null)
    addToast("success", "Workflow activated — staff notified")
    // 6. Navigate using the actual URL string
    navigate("/task-board") 
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generate New Workflow</h1>
          <p className="text-sm text-slate-500 mt-1">
            Paste any unstructured input — GLM extracts intent and generates a structured, actionable workflow.
          </p>
        </div>
      </div>

      {/* Grid Layout: Fixed left column, expanding right column */}
      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 items-start">
        
        {/* Left Column (Input) - Sticky so it stays on screen when scrolling long workflows */}
        <div className="sticky top-6">
          <WorkflowInput onGenerate={handleGenerate} />
        </div>
        
        {/* Right Column (Results) */}
        <div className="min-w-0">
          <WorkflowResult
            data={workflow}
            onApprove={handleApprove}
            onReset={() => setWorkflow(null)}
          />
        </div>

      </div>
    </div>
  )
}