import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"
import { ArrowUpRight, Sparkles, Activity, Clock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"

import { useToastStore } from "../store/useToastStore"
import { useAuthStore } from "../store/useAuthStore"
import { useStatsStore } from "../store/useStatsStore"

import WorkflowInput from "../components/WorkflowInput"
import WorkflowResult from "../components/WorkflowResult"

import { createWorkflow } from "../api/workflows"
import { generateWorkflow } from "../api/glm"
import { getWorkflowTrend } from "../api/stats"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDisplayName(fullName) {
  if (!fullName) return "there"
  const words = fullName.trim().split(/\s+/)
  if (words.length <= 2) return fullName
  return words.slice(0, 2).join(" ")
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function getDateLine() {
  return new Date().toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

// Animated number that counts up smoothly when value changes.
function CountUp({ value, duration = 0.9 }) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (n) => Math.round(n).toLocaleString())

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // expo-out
    })
    return controls.stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <motion.span>{display}</motion.span>
}

// ─── Hero stat with sparkline ───────────────────────────────────────────────

function HeroStat({ activeCount, trend, trendLoading }) {
  const total = trend.reduce((sum, d) => sum + d.count, 0)
  const maxDay = trend.reduce((max, d) => Math.max(max, d.count), 0)

  // Compute simple % change vs yesterday
  const today = trend[trend.length - 1]?.count ?? 0
  const yesterday = trend[trend.length - 2]?.count ?? 0
  const delta = today - yesterday
  const deltaPct = yesterday > 0 ? Math.round((delta / yesterday) * 100) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d3a3a] via-[#0a4747] to-[#082929] text-white shadow-[0_30px_60px_-20px_rgba(13,58,58,0.4)]"
    >
      {/* Decorative grid texture */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
      {/* Orange glow blob */}
      <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-[#f97316] opacity-20 blur-3xl pointer-events-none" />

      <div className="relative p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-10">
          {/* Left: number + label */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-teal-200/70">
                Active workflows · live
              </p>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h2
                className="text-7xl md:text-8xl font-bold leading-none tracking-tight"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144, 'SOFT' 80" }}
              >
                <CountUp value={activeCount} />
              </h2>
              {deltaPct !== null && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    delta >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-orange-400/20 text-orange-300"
                  }`}
                >
                  <ArrowUpRight size={12} className={delta < 0 ? "rotate-90" : ""} />
                  {delta >= 0 ? "+" : ""}{deltaPct}%
                </motion.div>
              )}
            </div>

            <p className="mt-4 text-sm text-teal-100/80 max-w-md leading-relaxed">
              {total > 0 ? (
                <>
                  <span className="font-semibold text-white">{total}</span> workflow{total === 1 ? "" : "s"} created in the last 7 days
                  {today > 0 && <> — <span className="font-semibold text-white">{today}</span> today.</>}
                </>
              ) : (
                "No workflows yet this week. Generate one below to get started."
              )}
            </p>
          </div>

          {/* Right: sparkline */}
          <div className="flex-1 min-w-0 md:max-w-md w-full">
            <div className="h-28 md:h-32">
              {!trendLoading && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      cursor={{ stroke: "#fb923c", strokeWidth: 1, strokeDasharray: "3 3" }}
                      contentStyle={{
                        background: "rgba(8, 41, 41, 0.95)",
                        border: "1px solid rgba(251, 146, 60, 0.4)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        padding: "6px 10px",
                      }}
                      labelStyle={{ color: "#fed7aa", fontWeight: 700 }}
                      itemStyle={{ color: "white" }}
                      formatter={(v) => [`${v} workflow${v === 1 ? "" : "s"}`, ""]}
                      separator=""
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#fb923c"
                      strokeWidth={2.5}
                      fill="url(#heroGradient)"
                      animationDuration={1200}
                      animationEasing="ease-out"
                      dot={{ r: 0 }}
                      activeDot={{ r: 5, fill: "#fb923c", stroke: "white", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Day axis */}
            <div className="flex justify-between mt-1 px-1">
              {trend.map((d, i) => (
                <span key={i} className={`text-[10px] font-mono ${i === trend.length - 1 ? "text-orange-300 font-bold" : "text-teal-200/50"}`}>
                  {d.date.charAt(0)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Smaller stat tile ───────────────────────────────────────────────────────

function StatTile({ label, value, sublabel, icon: Icon, accent, delay, onClick }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-white border border-stone-200/80 p-5 text-left hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-shadow"
    >
      <div className={`absolute top-0 left-0 h-[3px] w-full ${accent}`} />

      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-500">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-stone-50 group-hover:bg-stone-100 transition-colors flex items-center justify-center">
          <Icon size={13} className="text-stone-600" />
        </div>
      </div>

      <div
        className="text-4xl font-bold text-stone-900 leading-none tracking-tight"
        style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" }}
      >
        <CountUp value={value} />
      </div>

      {sublabel && (
        <p className="mt-2 text-[11px] text-stone-500 leading-relaxed">{sublabel}</p>
      )}

      <ArrowUpRight
        size={14}
        className="absolute bottom-4 right-4 text-stone-300 group-hover:text-stone-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
      />
    </motion.button>
  )
}

// ─── Generating placeholder (more refined version) ──────────────────────────

function GeneratingPlaceholder() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-12 flex flex-col items-center justify-center min-h-[440px] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/40 via-transparent to-orange-50/30 pointer-events-none" />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="relative w-20 h-20 mb-6"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0d3a3a] to-[#0a4747] flex items-center justify-center shadow-xl">
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={28} className="text-orange-400" />
          </motion.div>
        </div>
        <div className="absolute -inset-3 rounded-2xl border-2 border-orange-300/40 animate-ping opacity-50" />
      </motion.div>

      <h3 className="relative text-xl font-bold text-stone-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
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

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const profile = useAuthStore((s) => s.profile)

  // Stats from store (already live + realtime)
  const active = useStatsStore((s) => s.active)
  const pending_review = useStatsStore((s) => s.pending_review)
  const completed_today = useStatsStore((s) => s.completed_today)
  const unresolved_flags = useStatsStore((s) => s.unresolved_flags)

  // Local state for workflow generator
  const [workflow, setWorkflow] = useState(null)
  const [rawInput, setRawInput] = useState("")
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  // 7-day trend (separate from realtime store since it's heavier)
  const [trend, setTrend] = useState([])
  const [trendLoading, setTrendLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getWorkflowTrend(7)
      .then((data) => { if (!cancelled) { setTrend(data); setTrendLoading(false) } })
      .catch((err) => {
        console.error("getWorkflowTrend failed:", err)
        if (!cancelled) setTrendLoading(false)
      })
    return () => { cancelled = true }
  }, [active]) // refetch when total count changes (good enough heuristic)

  const handleGenerate = async (input) => {
    setGenerating(true)
    setWorkflow(null)
    try {
      const wf = await generateWorkflow(input, "auto", "normal")
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
      addToast("success", "Workflow approved and activated")
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
    <div className="max-w-7xl mx-auto w-full pb-12 space-y-8">
      {/* Editorial header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between gap-6 flex-wrap"
      >
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-2">
            {getDateLine()}
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold text-stone-900 leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
          >
            {getGreeting()},<br />
            <span className="italic font-light text-stone-600">{getDisplayName(profile?.full_name)}</span>
          </h1>
        </div>
        <button
          onClick={() => navigate("/new-workflow")}
          className="group flex items-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-full text-sm font-semibold hover:bg-stone-800 transition-all active:scale-[0.98] shadow-md"
        >
          New workflow
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </motion.div>

      {/* Hero stat */}
      <HeroStat activeCount={active} trend={trend} trendLoading={trendLoading} />

      {/* Three smaller stat tiles in an asymmetric grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Pending review"
          value={pending_review}
          sublabel={pending_review > 0 ? "Need approval to activate" : "Queue is clear"}
          icon={Clock}
          accent="bg-amber-400"
          delay={0.1}
          onClick={() => navigate("/queue")}
        />
        <StatTile
          label="Completed"
          value={completed_today}
          sublabel="Workflows closed"
          icon={CheckCircle2}
          accent="bg-emerald-500"
          delay={0.18}
          onClick={() => navigate("/queue")}
        />
        <StatTile
          label="Need attention"
          value={unresolved_flags}
          sublabel={unresolved_flags > 0 ? `${unresolved_flags} flagged for review` : "No flags pending"}
          icon={AlertTriangle}
          accent="bg-[#f97316]"
          delay={0.26}
          onClick={() => navigate("/human-review")}
        />
      </div>

      {/* Generator section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="pt-6"
      >
        <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-1.5">
              Generate workflow
            </p>
            <h2
              className="text-2xl font-bold text-stone-900 leading-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Paste a note. Get a workflow.
            </h2>
          </div>
        </div>

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
      </motion.div>
    </div>
  )
}