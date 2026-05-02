import { motion, AnimatePresence } from "framer-motion"
import { Activity, AlertCircle, Check, RotateCcw, Stethoscope, FileText, Clock, ArrowRight, ChevronRight } from "lucide-react"

const TYPE_LABEL = {
  appointment: "Clinic Appointment",
  urgent_walk_in: "Urgent Walk-In",
  lab_order: "Lab Order",
  specialist_referral: "Specialist Referral",
  routine_checkup: "Routine Checkup",
  follow_up: "Follow-Up",
}

const PRIORITY_STYLES = {
  normal: { dot: "bg-stone-400", text: "text-stone-700", bg: "bg-stone-50" },
  high: { dot: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-50" },
  urgent: { dot: "bg-orange-500", text: "text-orange-800", bg: "bg-orange-50" },
}

const STATUS_STYLES = {
  todo: { ring: "ring-stone-200", bg: "bg-white", text: "text-stone-700", label: "Pending" },
  in_progress: { ring: "ring-teal-200", bg: "bg-teal-50", text: "text-teal-800", label: "In motion" },
  done: { ring: "ring-emerald-200", bg: "bg-emerald-50", text: "text-emerald-800", label: "Done" },
}

const ROLE_GRADIENT = {
  doctor: "from-violet-500 to-violet-700",
  nurse: "from-pink-400 to-rose-600",
  lab_tech: "from-teal-500 to-teal-700",
  receptionist: "from-sky-400 to-blue-600",
  pharmacy: "from-orange-400 to-orange-600",
  manager: "from-stone-700 to-stone-900",
  system: "from-stone-400 to-stone-600",
}

const ROLE_LABEL = {
  doctor: "Doctor",
  nurse: "Nurse",
  lab_tech: "Lab Tech",
  receptionist: "Receptionist",
  pharmacy: "Pharmacy",
  manager: "Manager",
  system: "System",
}

function titleCase(s) {
  if (!s) return ""
  return s.toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-12 flex flex-col items-center justify-center min-h-[440px] relative overflow-hidden">
      {/* Decorative gradient mesh */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 border border-stone-200 flex items-center justify-center mb-5 shadow-sm">
        <Activity size={22} className="text-stone-400" strokeWidth={1.5} />
      </div>
      <h3
        className="relative text-2xl font-bold text-stone-900 leading-tight"
        style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" }}
      >
        <span className="italic font-light text-stone-400">No workflow</span> yet
      </h3>
      <p className="relative text-sm text-stone-500 mt-2 max-w-sm text-center leading-relaxed">
        Paste any clinic input on the left and the assistant will return a structured workflow ready for review.
      </p>
    </div>
  )
}

// ─── Stat block ──────────────────────────────────────────────────────────────

function StatBlock({ label, value, icon: Icon, accent }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon size={11} className="text-stone-400" strokeWidth={2} />}
        <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.18em] text-stone-500">
          {label}
        </p>
      </div>
      <p className={`text-sm font-semibold leading-tight ${accent || "text-stone-900"} truncate`}>
        {value}
      </p>
    </div>
  )
}

// ─── Step row (timeline item) ────────────────────────────────────────────────

function StepRow({ step, index, total }) {
  const status = STATUS_STYLES[step.status] || STATUS_STYLES.todo
  const role = step.assignee_role || "system"
  const roleGradient = ROLE_GRADIENT[role] || ROLE_GRADIENT.system
  const roleLabel = ROLE_LABEL[role] || role

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="relative pl-10 pb-4 last:pb-0"
    >
      {/* Vertical line */}
      {index < total - 1 && (
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-stone-200" />
      )}

      {/* Number badge */}
      <div
        className={`absolute left-0 top-0 w-8 h-8 rounded-full ring-2 ${status.ring} ${status.bg} flex items-center justify-center text-[11px] font-mono font-bold ${status.text}`}
      >
        {step.status === "done" ? <Check size={13} /> : String(index + 1).padStart(2, "0")}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-[13px] font-semibold text-stone-900 leading-snug flex-1">
            {step.title}
          </p>
          {step.is_escalation && (
            <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-orange-700 flex-shrink-0">
              <AlertCircle size={10} />
              Escalate
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-stone-500">
          <div
            className={`w-5 h-5 rounded-full bg-gradient-to-br ${roleGradient} flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0`}
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {roleLabel.slice(0, 2).toUpperCase()}
          </div>
          <span className="font-medium text-stone-700">{roleLabel}</span>
          {step.time && (
            <>
              <span className="text-stone-300">·</span>
              <Clock size={9} className="text-stone-400" />
              <span>{step.time}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function WorkflowResult({ data, onApprove, onReset, saving = false }) {
  if (!data) return <EmptyState />

  const priority = PRIORITY_STYLES[data.priority] || PRIORITY_STYLES.normal
  const typeLabel = TYPE_LABEL[data.type] || data.type
  const stepCount = data.steps?.length || 0
  const hasMissingInfo = data.missingInfo && data.missingInfo !== "None"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
    >
      {/* Header band */}
      <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-stone-50 to-white border-b border-stone-100">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-stone-500 mb-1.5">
              {typeLabel} · {stepCount} step{stepCount === 1 ? "" : "s"}
            </p>
            <h2
              className="text-2xl md:text-3xl font-bold text-stone-900 leading-[1.1] tracking-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
            >
              {data.title}
            </h2>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ring-1 ${priority.bg} ${priority.text} ring-stone-200 flex-shrink-0`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {data.priority}
          </span>
        </div>

        {/* Stat strip */}
        <div className="flex items-stretch gap-4 pt-2">
          <StatBlock
            label="Patient"
            value={data.patient ? titleCase(data.patient) : "Unspecified"}
            icon={Stethoscope}
          />
          <div className="w-px bg-stone-200" />
          <StatBlock
            label="Status"
            value={data.status === "pending_review" ? "Pending review" : data.status}
            icon={Clock}
            accent="text-amber-700"
          />
          <div className="w-px bg-stone-200" />
          <StatBlock
            label="Missing info"
            value={hasMissingInfo ? "Flagged" : "None"}
            icon={AlertCircle}
            accent={hasMissingInfo ? "text-orange-700" : "text-emerald-700"}
          />
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="px-6 py-4 border-b border-stone-100 bg-white">
          <div className="flex items-start gap-2.5">
            <FileText size={13} className="text-stone-400 mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-stone-600 leading-relaxed italic" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 }}>
              {data.summary}
            </p>
          </div>
        </div>
      )}

      {/* Missing info callout */}
      <AnimatePresence>
        {hasMissingInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-6 my-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle size={13} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-orange-700 mb-0.5">
                    Missing information
                  </p>
                  <p className="text-[12px] text-orange-900/80 leading-relaxed">
                    {data.missingInfo}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steps timeline */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-stone-500">
            Workflow steps
          </p>
          <p className="text-[10px] font-mono text-stone-400">
            {stepCount} action{stepCount === 1 ? "" : "s"}
          </p>
        </div>

        <div>
          {data.steps?.map((step, i) => (
            <StepRow key={i} step={step} index={i} total={data.steps.length} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between gap-3">
        <button
          onClick={onReset}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-stone-600 hover:text-stone-900 transition-colors disabled:opacity-50"
        >
          <RotateCcw size={12} />
          Discard
        </button>

        <motion.button
          onClick={onApprove}
          disabled={saving}
          whileHover={!saving ? { scale: 1.01 } : {}}
          whileTap={!saving ? { scale: 0.99 } : {}}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saving
              ? "bg-stone-200 text-stone-500 cursor-not-allowed"
              : "bg-gradient-to-r from-[#0d3a3a] to-[#082929] text-white shadow-md hover:shadow-lg"
          }`}
        >
          {saving ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Approve & activate
              <ArrowRight size={14} />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}