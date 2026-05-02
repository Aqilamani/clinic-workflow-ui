import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle2, ArrowUpRight, UserCheck, Info, RefreshCw } from "lucide-react"
import { useToastStore } from "../store/useToastStore"
import { getActiveFlags, resolveFlag, subscribeToFlags } from "../api/reviewFlags"
import { FLAG_URGENCY_LABELS } from "../lib/labels"

const urgencyConfig = {
  urgent:  { badge: "bg-red-100 text-red-700 border-red-200" },
  pending: { badge: "bg-amber-100 text-amber-700 border-amber-200" },
  blocked: { badge: "bg-red-100 text-red-700 border-red-200" },
}

const TYPE_LABELS = {
  appointment: "Clinic Appointment",
  urgent_walk_in: "Urgent Walk-In",
  lab_order: "Lab Order",
  specialist_referral: "Specialist Referral",
  routine_checkup: "Routine Checkup",
  follow_up: "Follow-Up",
}

// Format a UUID into a short display ID
function shortId(uuid) {
  return uuid ? `WF-${uuid.slice(0, 8).toUpperCase()}` : ""
}

// Build the "issue" line shown under the patient name (workflow title + type)
function buildIssueLine(workflow) {
  if (!workflow) return ""
  const typeLabel = TYPE_LABELS[workflow.type] || workflow.type
  return `${typeLabel} — ${workflow.summary?.slice(0, 100) || workflow.title}${workflow.summary?.length > 100 ? "…" : ""}`
}

// ─── Card ────────────────────────────────────────────────────────────────────

function ReviewCard({ flag, onResolve, isResolving }) {
  const [resolved, setResolved] = useState(false)
  const uc = urgencyConfig[flag.urgency] || urgencyConfig.pending

  const patient = flag.workflow?.patient
  const patientName = patient?.is_unknown
    ? `${patient.full_name} (unidentified)`
    : (patient?.full_name || "Unknown patient")

  const handleAction = async (note, toast) => {
    setResolved(true)
    try {
      await onResolve(flag.id, note, toast)
    } catch (err) {
      // Parent shows the toast; we just unfade
      setResolved(false)
    }
  }

  return (
    <div className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
      resolved ? "opacity-40 pointer-events-none grayscale" : "border-slate-200 hover:shadow-md hover:border-blue-300"
    }`}>
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">
            {patientName} — <span className="font-mono text-[11px] text-slate-400">{shortId(flag.workflow?.id)}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{buildIssueLine(flag.workflow)}</p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${uc.badge} flex-shrink-0`}>
          {FLAG_URGENCY_LABELS[flag.urgency] || flag.urgency}
        </span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Missing info */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Missing Information</p>
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 leading-relaxed">{flag.missing_info}</p>
          </div>
        </div>

        {/* AI Recommendation */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
            <span className="inline-flex items-center gap-1"><Info size={10} /> AI Recommendation</span>
          </p>
          <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-800 leading-relaxed">{flag.ai_recommendation}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50 mt-4">
          <button
            disabled={isResolving}
            onClick={() => handleAction(
              "Approved AI recommendation",
              `Workflow approved — ${patientName} proceeding`
            )}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
          >
            <CheckCircle2 size={12} /> Approve AI Rec
          </button>
          <button
            disabled={isResolving}
            onClick={() => handleAction(
              "Sent request to front desk for missing patient information",
              `Request sent to front desk to collect missing info for ${patientName}`
            )}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-60"
          >
            <UserCheck size={12} /> Request Info
          </button>
          <button
            disabled={isResolving}
            onClick={() => handleAction(
              "Case reassigned to duty doctor",
              `Case reassigned to duty doctor for ${patientName}`
            )}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-700 bg-amber-50 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors disabled:opacity-60"
          >
            <ArrowUpRight size={12} /> Reassign
          </button>
        </div>
      </div>
    </div>
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
      setError(err.message || "Failed to load review flags")
      console.error("getActiveFlags failed:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlags()

    // Realtime: when another user resolves a flag, remove it from our list
    const unsubscribe = subscribeToFlags((change) => {
      if (change.eventType === "INSERT") {
        // New flag created (e.g. someone just approved a workflow with missing info)
        loadFlags()
      } else if (change.eventType === "UPDATE") {
        const updated = change.new
        // If it was resolved, remove from list
        if (updated.resolved) {
          setFlags((prev) => prev.filter((f) => f.id !== updated.id))
        } else {
          setFlags((prev) =>
            prev.map((f) => (f.id === updated.id ? { ...f, ...updated } : f))
          )
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
      // Brief delay so the fade-out animation has time to play, then remove
      setTimeout(() => {
        setFlags((prev) => prev.filter((f) => f.id !== flagId))
      }, 600)
    } catch (err) {
      addToast("warn", err.message || "Failed to resolve flag")
      throw err  // re-throw so the card un-fades
    } finally {
      setResolvingId(null)
    }
  }

  const activeCount = flags.length

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Human Intervention</h1>
            {activeCount > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200 animate-pulse">
                {activeCount} Actionable
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Workflows flagged by the AI due to missing critical data or ambiguous logic.
          </p>
        </div>
        <button
          onClick={loadFlags}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Failed to load review flags</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
          <button
            onClick={loadFlags}
            className="mt-3 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-md transition-colors"
          >
            Try again
          </button>
        </div>
      ) : activeCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">All Clear!</h3>
          <p className="text-sm text-slate-500 mt-1">No pending workflows require human review right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          {flags.map(flag => (
            <ReviewCard
              key={flag.id}
              flag={flag}
              onResolve={handleResolve}
              isResolving={resolvingId === flag.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}