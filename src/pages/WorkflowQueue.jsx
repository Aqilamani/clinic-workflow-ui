import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Clock, CheckCircle2, AlertCircle, PlayCircle, ArrowRight, RefreshCw, MoreHorizontal } from "lucide-react"
import { useToastStore } from "../store/useToastStore"
import { WORKFLOW_STATUS_LABELS, WORKFLOW_PRIORITY_LABELS } from "../lib/labels"
import { getWorkflows, approveWorkflow } from "../api/workflows"

const FILTER_TABS = [
  { value: "all",            label: "All" },
  { value: "pending_review", label: "Pending" },
  { value: "active",         label: "Active" },
  { value: "delayed",        label: "Delayed" },
  { value: "completed",      label: "Completed" },
]

const TYPE_LABELS = {
  appointment: "Clinic Appointment",
  urgent_walk_in: "Urgent Walk-In",
  lab_order: "Lab Order",
  specialist_referral: "Specialist Referral",
  routine_checkup: "Routine Checkup",
  follow_up: "Follow-Up",
}

const STATUS_STYLES = {
  active:         { dot: "bg-teal-500",     bg: "bg-teal-50",     text: "text-teal-800",     ring: "ring-teal-100",     icon: PlayCircle },
  pending_review: { dot: "bg-amber-500",    bg: "bg-amber-50",    text: "text-amber-800",    ring: "ring-amber-100",    icon: Clock },
  delayed:        { dot: "bg-orange-500",   bg: "bg-orange-50",   text: "text-orange-800",   ring: "ring-orange-200",   icon: AlertCircle },
  completed:      { dot: "bg-emerald-500",  bg: "bg-emerald-50",  text: "text-emerald-800",  ring: "ring-emerald-100",  icon: CheckCircle2 },
}

function titleCase(s) {
  if (!s) return ""
  return s.toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

function shortId(uuid) {
  return uuid ? uuid.slice(0, 8).toUpperCase() : ""
}

function timeAgo(iso) {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

// Segmented progress: one dot per task, filled if done
function ProgressDots({ completed, total, completedColor = "bg-emerald-500" }) {
  // For very long workflows (>10 steps), fall back to bar style
  if (total > 10) {
    const pct = total > 0 ? (completed / total) * 100 : 0
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] font-mono text-stone-600 whitespace-nowrap">
          {completed}/{total}
        </span>
        <div className="flex-1 min-w-[60px] h-1 bg-stone-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full ${completedColor} rounded-full`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[11px] font-mono text-stone-600 whitespace-nowrap">
        {completed}/{total}
      </span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i < completed ? completedColor : "bg-stone-200"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Status pill — mono uppercase with colored dot
function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending_review
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <Icon size={11} strokeWidth={2.5} />
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
        {WORKFLOW_STATUS_LABELS[status]}
      </span>
    </span>
  )
}

// Priority indicator — small colored dot, only shows when high/urgent
function PriorityDot({ priority }) {
  if (priority === "normal") return null
  const colors = {
    high: { color: "bg-amber-500", label: WORKFLOW_PRIORITY_LABELS.high },
    urgent: { color: "bg-orange-500 animate-pulse", label: WORKFLOW_PRIORITY_LABELS.urgent },
  }
  const c = colors[priority]
  if (!c) return null
  return <span className={`w-1.5 h-1.5 rounded-full ${c.color} flex-shrink-0`} title={c.label} />
}

export default function WorkflowQueue() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [approvingId, setApprovingId] = useState(null)

  const addToast = useToastStore((s) => s.addToast)

  const loadWorkflows = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getWorkflows()
      setWorkflows(data)
    } catch (err) {
      setError(err.message || "Failed to load")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkflows()
  }, [])

  const handleApprove = async (id) => {
    setApprovingId(id)
    try {
      const updated = await approveWorkflow(id)
      setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)))
      addToast("success", `Workflow ${shortId(id)} activated`)
    } catch (err) {
      addToast("warn", err.message || "Failed to approve")
    } finally {
      setApprovingId(null)
    }
  }

  const filteredWorkflows = workflows.filter((wf) => {
    const patientName = wf.patient?.full_name || ""
    const matchesSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wf.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "all" || wf.status === activeTab
    return matchesSearch && matchesTab
  })

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
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-2">
            Workflow Queue · {workflows.length} total
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold text-stone-900 leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
          >
            <span className="italic font-light text-stone-500">Every</span> workflow,
            <br className="hidden sm:block" />
            <span className="italic font-light text-stone-500"> in one place.</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search patient or ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:shadow-sm w-64 transition-all"
            />
          </div>
          <button
            onClick={loadWorkflows}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300 rounded-xl text-sm font-semibold transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </motion.div>

      {/* Filter tabs — newspaper section style */}
      <div className="flex items-center gap-1 border-b border-stone-200 overflow-x-auto pb-px">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? workflows.length
              : workflows.filter((w) => w.status === tab.value).length
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`relative px-4 py-2.5 text-sm transition-colors whitespace-nowrap ${
                isActive ? "text-stone-900 font-semibold" : "text-stone-500 hover:text-stone-700 font-medium"
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`ml-1.5 text-[10px] font-mono ${
                    isActive ? "text-stone-500" : "text-stone-400"
                  }`}
                >
                  {String(count).padStart(2, "0")}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="queue-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0d3a3a]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[100px_2fr_1.5fr_1.5fr_1fr_100px] gap-4 px-5 py-3 bg-stone-50/60 border-b border-stone-200 text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-stone-500">
          <div>ID</div>
          <div>Patient · Type</div>
          <div>Status</div>
          <div>Progress</div>
          <div>Created</div>
          <div className="text-right">Action</div>
        </div>

        {loading ? (
          <div className="px-5 py-16 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-stone-200 border-t-[#0d3a3a] rounded-full animate-spin" />
              <span className="text-sm font-mono text-stone-500">Loading…</span>
            </div>
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <AlertCircle size={28} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-800">Couldn't load workflows</p>
            <p className="text-xs text-stone-500 mt-1">{error}</p>
            <button
              onClick={loadWorkflows}
              className="mt-3 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-mono uppercase tracking-wider text-stone-400">
              {workflows.length === 0 ? "No workflows yet" : "No matches"}
            </p>
            <p className="text-xs text-stone-400 mt-1.5">
              {workflows.length === 0
                ? "Create one from the Dashboard."
                : "Try a different filter or search term."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            <AnimatePresence>
              {filteredWorkflows.map((wf, index) => (
                <motion.div
                  key={wf.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
                  className="grid grid-cols-[100px_2fr_1.5fr_1.5fr_1fr_100px] gap-4 px-5 py-4 items-center hover:bg-stone-50/60 transition-colors group"
                >
                  {/* ID */}
                  <div className="text-[11px] font-mono font-medium text-stone-500 truncate" title={wf.id}>
                    WF-{shortId(wf.id)}
                  </div>

                  {/* Patient + type */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-[15px] font-semibold text-stone-900 truncate leading-tight"
                        style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 600 }}
                      >
                        {titleCase(wf.patient?.full_name) || "Unknown patient"}
                      </p>
                      <PriorityDot priority={wf.priority} />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                      {TYPE_LABELS[wf.type] || wf.type}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusPill status={wf.status} />
                  </div>

                  {/* Progress */}
                  <div>
                    <ProgressDots
                      completed={wf.completed_tasks}
                      total={wf.total_tasks}
                      completedColor={wf.status === "completed" ? "bg-emerald-500" : "bg-[#0d3a3a]"}
                    />
                  </div>

                  {/* Created */}
                  <div className="text-[12px] text-stone-500 font-mono">{timeAgo(wf.created_at)}</div>

                  {/* Action */}
                  <div className="flex items-center justify-end gap-1">
                    {wf.status === "pending_review" ? (
                      <motion.button
                        onClick={() => handleApprove(wf.id)}
                        disabled={approvingId === wf.id}
                        whileTap={{ scale: 0.96 }}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-60"
                      >
                        {approvingId === wf.id ? "..." : "Approve"}
                      </motion.button>
                    ) : (
                      <button
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="View details"
                      >
                        <ArrowRight size={14} />
                      </button>
                    )}
                    <button
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="More"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}