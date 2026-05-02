import { Activity, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import { useStatsStore } from "../store/useStatsStore"

// Each card matches a colored top border + icon + number + sub-line + progress bar
const CARDS = [
  {
    key: "active",
    label: "Active Workflows",
    accent: "border-t-blue-500",
    iconBg: "bg-blue-50 text-blue-600",
    barBg: "bg-blue-500",
    Icon: Activity,
    subline: () => "Currently in progress",
  },
  {
    key: "pending_review",
    label: "Pending Reviews",
    accent: "border-t-amber-400",
    iconBg: "bg-amber-50 text-amber-600",
    barBg: "bg-amber-500",
    Icon: Clock,
    subline: (v) => v > 0 ? `${v} need urgent action` : "All caught up",
  },
  {
    key: "completed_today",
    label: "Completed",
    accent: "border-t-emerald-500",
    iconBg: "bg-emerald-50 text-emerald-600",
    barBg: "bg-emerald-500",
    Icon: CheckCircle2,
    subline: () => "Successfully completed",
  },
  {
    key: "unresolved_flags",
    label: "Need Attention",
    accent: "border-t-red-500",
    iconBg: "bg-red-50 text-red-600",
    barBg: "bg-red-500",
    Icon: AlertTriangle,
    subline: (v) => v > 0 ? `${v} flag${v === 1 ? "" : "s"} unresolved` : "No flags pending",
  },
]

export default function DashboardCards() {
  // Select each primitive individually — Zustand returns the same number on
  // every render unless the value actually changes, so React stays stable.
  // Returning an object literal here would be a new reference every render
  // and would cause an infinite re-render loop.
  const active = useStatsStore((s) => s.active)
  const pending_review = useStatsStore((s) => s.pending_review)
  const completed_today = useStatsStore((s) => s.completed_today)
  const unresolved_flags = useStatsStore((s) => s.unresolved_flags)
  const loaded = useStatsStore((s) => s.loaded)

  const values = { active, pending_review, completed_today, unresolved_flags }

  // Largest count for relative progress bars (avoid divide-by-zero)
  const maxValue = Math.max(active, pending_review, completed_today, unresolved_flags, 1)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, accent, iconBg, barBg, Icon, subline }) => {
        const value = values[key]
        const widthPct = loaded ? (value / maxValue) * 100 : 0

        return (
          <div
            key={key}
            className={`bg-white rounded-xl border border-slate-200 border-t-4 ${accent} shadow-sm p-5`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {label}
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
                <Icon size={14} />
              </div>
            </div>

            <div className="text-3xl font-bold text-slate-900 mb-1">
              {loaded ? value : (
                <span className="inline-block w-8 h-8 bg-slate-100 rounded animate-pulse" />
              )}
            </div>

            <p className="text-xs text-slate-500 mb-3 min-h-[16px]">
              {loaded ? subline(value) : ""}
            </p>

            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${barBg} rounded-full transition-all duration-500`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}