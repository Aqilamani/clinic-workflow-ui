import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, CheckCircle2, ArrowUpRight, UserCheck, Sparkles, RefreshCw, Stethoscope } from "lucide-react"
import { useToastStore } from "../store/useToastStore"
import { getActiveFlags, resolveFlag, subscribeToFlags } from "../api/reviewFlags"
import { FLAG_URGENCY_LABELS } from "../lib/labels"

const URGENCY_STYLES = {
  urgent:  { dot: "bg-orange-500 animate-pulse", text: "text-orange-700",  ring: "ring-orange-200",  bg: "bg-orange-50",  accent: "bg-orange-500" },
  pending: { dot: "bg-amber-500",                text: "text-amber-700",   ring: "ring-amber-200",   bg: "bg-amber-50",   accent: "bg-amber-500" },
  blocked: { dot: "bg-red-500",                  text: "text-red-700",     ring: "ring-red-200",     bg: "bg-red-50",     accent: "bg-red-500" },
}

const TYPE_LABELS = {
  appointment: "Clinic Appointment",
  urgent_walk_in: "Urgent Walk-In",
  lab_order: "Lab Order",
  specialist_referral: "Specialist Referral",
  routine_checkup: "Routine Checkup",
  follow_up: "Follow-Up",
}

function titleCase(s) {
  if (!s) return ""
  return s.toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

function shortId(uuid) {
  return uuid ? uuid.slice(0, 8).toUpperCase() : ""
}

// ─── Case card ──────────────────────────────────────────────────────────────

function CaseCard({ flag, onResolve, isResolving, index }) {
  const [resolved, setResolved] = useState(false)
  const u = URGENCY_STYLES[flag.urgency] || URGENCY_STYLES.pending

  const patient = flag.workflow?.patient
  const patientName = patient?.is_unknown
    ? `${titleCase(patient.full_name)} (unidentified)`
    : titleCase(patient?.full_name) || "Unknown patient"

  const handleAction = async (note, toastMsg) => {
    setResolved(true)
    try {
      await onResolve(flag.id, note, toastMsg)
    } catch {
      setResolved(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: resolved ? 0.4 : 1, y: 0, scale: resolved ? 0.98 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={`relative bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden transition-shadow ${
        resolved ? "pointer-events-none" : "hover:shadow-md hover:border-stone-300"
      }`}
    >
      {/* Top accent stripe based on urgency */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${u.accent}`} />

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-stone-100">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Stethoscope size={11} className="text-stone-400 flex-shrink-0" />
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-500">
                Case {shortId(flag.workflow?.id)}
              </p>
            </div>
            <h3
              className="text-xl font-bold text-stone-900 leading-tight tracking-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" }}
            >
              {patientName}
            </h3>
            <p className="text-[12px] text-stone-500 mt-1 truncate">
              {TYPE_LABELS[flag.workflow?.type] || flag.workflow?.type}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ring-1 ${u.bg} ${u.text} ${u.ring} flex-shrink-0`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              {FLAG_URGENCY_LABELS[flag.urgency] || flag.urgency}
            </span>
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Missing info */}
        <div>
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-stone-500 mb-1.5">
            Missing information
          </p>
          <div className="flex items-start gap-2 p-3 bg-orange-50/60 border border-orange-200/80 rounded-xl">
            <AlertTriangle size={13} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-orange-900/80 leading-relaxed">{flag.missing_info}</p>
          </div>
        </div>

        {/* AI recommendation */}
        <div>
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-stone-500 mb-1.5 flex items-center gap-1">
            <Sparkles size={9} className="text-orange-500" />
            AI Recommendation
          </p>
          <div className="flex items-start gap-2 p-3 bg-teal-50/40 border border-teal-200/80 rounded-xl">
            <CheckCircle2 size={13} className="text-teal-700 mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-teal-900/80 leading-relaxed">{flag.ai_recommendation}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/40 flex flex-wrap gap-2">
        <motion.button
          onClick={() => handleAction("Approved AI recommendation", `Workflow approved — ${patientName} proceeding`)}
          disabled={isResolving}
          whileTap={{ scale: 0.97 }}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#0d3a3a] to-[#082929] text-white rounded-xl text-[12px] font-semibold hover:shadow-md transition-shadow disabled:opacity-60"
        >
          <CheckCircle2 size={13} />
          Approve AI rec
        </motion.button>
        <motion.button
          onClick={() => handleAction("Sent request to front desk for missing patient information", `Info request sent for ${patientName}`)}
          disabled={isResolving}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50 rounded-xl text-[12px] font-semibold transition-colors disabled:opacity-60"
        >
          <UserCheck size={12} />
          Request info
        </motion.button>
        <motion.button
          onClick={() => handleAction("Case reassigned to duty doctor", `Reassigned for ${patientName}`)}
          disabled={isResolving}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50 rounded-xl text-[12px] font-semibold transition-colors disabled:opacity-60"
        >
          <ArrowUpRight size={12} />
          Reassign
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function HumanReview() {
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resolvingId, setResolvingId] = useState(null)
  const addToast = useToastStore((s) => s.addToast)

  const loadFlags = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getActiveFlags()
      setFlags(data)
    } catch (err) {
      setError(err.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlags()
    const unsubscribe = subscribeToFlags((change) => {
      if (change.eventType === "INSERT") {
        loadFlags()
      } else if (change.eventType === "UPDATE") {
        const updated = change.new
        if (updated.resolved) {
          setFlags((prev) => prev.filter((f) => f.id !== updated.id))
        } else {
          setFlags((prev) => prev.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)))
        }
      } else if (change.eventType === "DELETE") {
        setFlags((prev) => prev.filter((f) => f.id !== change.old.id))
      }
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleResolve = async (flagId, note, toastMsg) => {
    setResolvingId(flagId)
    try {
      await resolveFlag(flagId, note)
      addToast("success", toastMsg)
      setTimeout(() => {
        setFlags((prev) => prev.filter((f) => f.id !== flagId))
      }, 500)
    } catch (err) {
      addToast("warn", err.message || "Failed to resolve")
      throw err
    } finally {
      setResolvingId(null)
    }
  }

  const activeCount = flags.length
  const urgentCount = flags.filter((f) => f.urgency === "urgent").length

  return (
    <div className="max-w-7xl mx-auto w-full pb-12 space-y-6">
      {/* Editorial header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-2 flex items-center gap-2">
            Human Review
            {activeCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-700 ring-1 ring-orange-200 text-[10px] font-mono font-bold">
                <span className={`w-1 h-1 rounded-full bg-orange-500 ${urgentCount > 0 ? "animate-pulse" : ""}`} />
                {activeCount} pending
              </span>
            )}
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold text-stone-900 leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
          >
            <span className="italic font-light text-stone-500">Manager's</span> desk
          </h1>
          <p className="text-sm text-stone-500 mt-2 max-w-md">
            Cases the AI flagged for your judgement — missing information, ambiguous intent, or escalations that need your call.
          </p>
        </div>
        <button
          onClick={loadFlags}
          className="flex items-center gap-2 px-3 py-2.5 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300 rounded-xl text-sm font-semibold transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </motion.div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-stone-200 border-t-[#0d3a3a] rounded-full animate-spin" />
            <span className="text-sm font-mono text-stone-500">Loading…</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <AlertTriangle size={32} className="text-orange-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Couldn't load flags
          </h3>
          <p className="text-sm text-stone-500 mt-1">{error}</p>
          <button
            onClick={loadFlags}
            className="mt-3 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      ) : activeCount === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-stone-200 p-16 text-center relative overflow-hidden"
        >
          {/* Decorative gradient mesh */}
          <div className="absolute inset-0 opacity-50 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle2 size={22} className="text-emerald-600" strokeWidth={1.8} />
            </div>
            <h3
              className="text-2xl font-bold text-stone-900"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" }}
            >
              <span className="italic font-light text-stone-400">All</span> caught up
            </h3>
            <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
              No workflows pending review. New flags will appear here automatically as they're raised.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <AnimatePresence>
            {flags.map((flag, index) => (
              <CaseCard
                key={flag.id}
                flag={flag}
                onResolve={handleResolve}
                isResolving={resolvingId === flag.id}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}