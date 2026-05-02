import { useState } from "react"
import { motion } from "framer-motion"
import { Zap, Sparkles, Paperclip } from "lucide-react"

const QUICK_PROMPTS = [
  {
    label: "Chest pain walk-in",
    prompt: "54-year-old male, chest pain and dizziness, walked in 5 minutes ago. Conscious, no allergies known.",
  },
  {
    label: "Paediatric fever",
    prompt: "Mrs Lim's daughter, Fatimah, 8 years old, fever 39°C since last night, no other symptoms.",
  },
  {
    label: "Lab order",
    prompt: "FBC dan ujian thyroid untuk Encik Lim Wei Hong, IC 850101-10-1234.",
  },
  {
    label: "Elderly fall",
    prompt: "Pesakit warga emas, tiada IC, jatuh dari motor, tangan bengkak, anaknya jadi penterjemah.",
  },
]

const TYPE_OPTIONS = [
  { value: "auto", label: "Auto-detect" },
  { value: "appointment", label: "Appointment" },
  { value: "urgent_walk_in", label: "Urgent walk-in" },
  { value: "lab", label: "Lab order" },
  { value: "specialist_referral", label: "Specialist referral" },
  { value: "follow_up", label: "Follow-up" },
]

const PRIORITY_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

export default function WorkflowInput({ onGenerate, generating = false }) {
  const [text, setText] = useState("")
  const [type, setType] = useState("auto")
  const [priority, setPriority] = useState("normal")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim() || generating) return
    onGenerate(text, type, priority)
  }

  const handleQuickPrompt = (prompt) => {
    setText(prompt)
  }

  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 bg-stone-50/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d3a3a] to-[#082929] flex items-center justify-center shadow-sm">
          <Zap size={15} className="text-orange-400" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-bold text-stone-900 leading-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" }}
          >
            Input Panel
          </h3>
          <p className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">
            WhatsApp · Notes · Forms
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Quick prompts */}
        <div>
          <p className="text-[10px] font-mono font-semibold text-stone-500 uppercase tracking-[0.18em] mb-2">
            Quick examples
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                type="button"
                onClick={() => handleQuickPrompt(qp.prompt)}
                disabled={generating}
                className="px-2.5 py-1 bg-stone-50 border border-stone-200 hover:bg-orange-50 hover:border-orange-200 text-stone-600 hover:text-orange-700 rounded-full text-[11px] font-medium transition-colors disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea — editor feel */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={generating}
            placeholder="Paste any unstructured input — WhatsApp message, receptionist note, doctor instruction, or patient request…"
            rows={5}
            className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-[14px] text-stone-800 placeholder:text-stone-400 placeholder:italic focus:outline-none focus:bg-white focus:border-stone-400 focus:shadow-sm transition-all resize-none disabled:opacity-60"
            style={{ fontFamily: "'Fraunces', Georgia, serif", lineHeight: 1.55 }}
          />
          {/* Live word/char count */}
          {text.length > 0 && (
            <div className="absolute bottom-2 right-3 flex items-center gap-2 text-[10px] font-mono text-stone-400">
              <span>{wordCount}w</span>
              <span className="text-stone-300">·</span>
              <span>{charCount}c</span>
            </div>
          )}
        </div>

        {/* Type + priority — minimal selects */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono font-semibold text-stone-500 uppercase tracking-[0.18em] mb-1.5">
              Workflow type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={generating}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] text-stone-800 focus:outline-none focus:bg-white focus:border-stone-400 transition-colors disabled:opacity-60 cursor-pointer appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a8a29e' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.25em",
                paddingRight: "2rem",
              }}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-semibold text-stone-500 uppercase tracking-[0.18em] mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={generating}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] text-stone-800 focus:outline-none focus:bg-white focus:border-stone-400 transition-colors disabled:opacity-60 cursor-pointer appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a8a29e' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.25em",
                paddingRight: "2rem",
              }}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Attach (cosmetic for now) */}
        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-stone-400 hover:text-stone-600 transition-colors"
          title="File attachment — coming soon"
        >
          <Paperclip size={12} /> Attach
        </button>

        {/* Generate button */}
        <motion.button
          type="submit"
          disabled={generating || !text.trim()}
          whileHover={!generating && text.trim() ? { scale: 1.005 } : {}}
          whileTap={!generating && text.trim() ? { scale: 0.99 } : {}}
          className={`relative w-full py-3.5 rounded-xl text-sm font-semibold transition-all overflow-hidden ${
            generating || !text.trim()
              ? "bg-stone-200 text-stone-500 cursor-not-allowed"
              : "bg-gradient-to-r from-[#0d3a3a] to-[#082929] text-white shadow-md hover:shadow-lg"
          }`}
        >
          {/* Subtle orange shimmer on hover when active */}
          {!generating && text.trim() && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          )}
          <span className="relative flex items-center justify-center gap-2">
            {generating ? (
              <>
                <Sparkles size={15} className="animate-pulse" />
                Reading…
              </>
            ) : (
              <>
                <Sparkles size={15} className={text.trim() ? "text-orange-400" : ""} />
                Generate workflow
              </>
            )}
          </span>
        </motion.button>
      </form>
    </div>
  )
}