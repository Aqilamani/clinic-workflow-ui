// src/components/WorkflowInput.jsx
// Fixed: removed lucide-react dependency (replaced with inline SVGs)
// Added: quick example chips, loading spinner, better layout

import { useState } from "react"

const EXAMPLES = [
  { label: "Chest pain walk-in", text: "Walk-in patient, male, 54, chest pain and dizziness. No prior records in system." },
  { label: "Paediatric fever", text: "Aisyah, 8 years old, fever and cough for 3 days — request appointment tomorrow morning." },
  { label: "Lab order", text: "Dr. Lim: please order FBC and lipid panel for Mr. Rajan, results needed before follow-up next week." },
  { label: "Elderly fall", text: "Elderly lady, 70s, came with son, wrist pain after fall, speaks only Malay." },
]

export default function WorkflowInput({ onGenerate }) {
  const [input, setInput] = useState("")
  const [type, setType] = useState("auto")
  const [priority, setPriority] = useState("normal")
  const [loading, setLoading] = useState(false)

  const handleGenerate = () => {
    if (!input.trim()) return
    setLoading(true)
    setTimeout(() => {
      onGenerate(input, type, priority)
      setLoading(false)
    }, 1800)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Input Panel</h3>
          <p className="text-[11px] text-slate-500">WhatsApp messages, doctor notes, forms</p>
        </div>
      </div>

      <div className="p-5">
        {/* Quick example chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => setInput(ex.text)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium border border-slate-200 hover:border-blue-200"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          placeholder="Paste any unstructured clinic input here — WhatsApp message, receptionist note, doctor instruction, or patient request..."
          className="w-full border border-slate-200 rounded-lg p-3.5 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
        />

        {/* Options row */}
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex-1 min-w-[130px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
              Workflow Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
            >
              <option value="auto">Auto-detect (GLM)</option>
              <option value="appointment">Appointment</option>
              <option value="walk-in">Walk-In</option>
              <option value="lab">Lab Order</option>
              <option value="referral">Referral</option>
              <option value="follow-up">Follow-Up</option>
            </select>
          </div>

          <div className="flex-1 min-w-[110px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-[11px] text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Attach
            </button>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!input.trim() || loading}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              {/* Spinner */}
              <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              GLM is reasoning…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Generate Workflow
            </>
          )}
        </button>
      </div>
    </div>
  )
}
