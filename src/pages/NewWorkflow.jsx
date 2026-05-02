import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles } from "lucide-react"
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
      addToast("success", `Workflow generated — ${wf.steps.length} steps, ready to review`)
    } catch (err) {
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
      addToast("success", "Workflow saved and activated")
      setWorkflow(null)
      setRawInput("")
      navigate("/queue")
    } catch (err) {
      addToast("warn", err.message || "Failed to save workflow")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full pb-12 space-y-6">
      {/* Editorial header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-2">
          Generate workflow
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold text-stone-900 leading-[1.05] tracking-tight"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
        >
          <span className="italic font-light text-stone-500">Paste a note.</span>{" "}
          Get a workflow.
        </h1>
        <p className="text-sm text-stone-500 mt-3 max-w-xl leading-relaxed">
          Drop in any unstructured input — a doctor's instruction, a WhatsApp from the
          receptionist, a brief description of a walk-in. The assistant extracts intent,
          identifies the patient, and assembles a structured workflow ready for review.
        </p>
      </motion.div>

      {/* Two-column workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-5 items-start">
        <div className="xl:sticky xl:top-6">
          <WorkflowInput onGenerate={handleGenerate} generating={generating} />
        </div>
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {generating ? (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <GeneratingPlaceholder />
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <WorkflowResult
                  data={workflow}
                  onApprove={handleApprove}
                  onReset={() => { setWorkflow(null); setRawInput("") }}
                  saving={saving}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Generating placeholder ──────────────────────────────────────────────────

function GeneratingPlaceholder() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-12 flex flex-col items-center justify-center min-h-[440px] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-100/40 rounded-full blur-3xl" />
      </div>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="relative w-20 h-20 mb-6"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0d3a3a] to-[#082929] flex items-center justify-center shadow-xl">
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={28} className="text-orange-400" />
          </motion.div>
        </div>
        <div className="absolute -inset-3 rounded-2xl border-2 border-orange-300/40 animate-ping opacity-50" />
      </motion.div>

      <h3
        className="relative text-xl font-bold text-stone-900"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        Reading the room…
      </h3>
      <p className="relative text-sm text-stone-500 mt-2 max-w-sm text-center leading-relaxed">
        Extracting clinical intent, identifying patient details, and assembling the workflow steps.
      </p>

      <div className="relative flex items-center gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-orange-500"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}