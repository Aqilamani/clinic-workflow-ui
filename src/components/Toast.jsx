import { CheckCircle2, AlertTriangle, Info } from "lucide-react"

const CONFIG = {
  success: { icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-200", iconColor: "text-emerald-600" },
  warn: { icon: AlertTriangle, bg: "bg-amber-50", border: "border-amber-200", iconColor: "text-amber-600" },
  info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", iconColor: "text-blue-600" },
}

export default function Toast({ type, message }) {
  const c = CONFIG[type] || CONFIG.info
  const Icon = c.icon
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg max-w-sm pointer-events-auto animate-in slide-in-from-right duration-200 ${c.bg} ${c.border}`}>
      <Icon size={15} className={`flex-shrink-0 ${c.iconColor}`} />
      <p className="text-xs font-semibold text-slate-700">{message}</p>
    </div>
  )
}
