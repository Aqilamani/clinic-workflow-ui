import { motion } from "framer-motion"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react"
import { useToastStore } from "../store/useToastStore"

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 ring-emerald-100",
    accent: "bg-emerald-500",
  },
  warn: {
    icon: AlertTriangle,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50 ring-orange-100",
    accent: "bg-orange-500",
  },
  info: {
    icon: Info,
    iconColor: "text-[#0d3a3a]",
    iconBg: "bg-teal-50 ring-teal-100",
    accent: "bg-[#0d3a3a]",
  },
}

export default function Toast({ id, type = "info", message }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const style = TOAST_STYLES[type] || TOAST_STYLES.info
  const Icon = style.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="relative w-full sm:w-[340px] bg-white rounded-xl border border-stone-200 shadow-lg shadow-stone-900/5 overflow-hidden"
    >
      {/* Left accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${style.accent}`} />

      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        {/* Icon */}
        <div className={`w-7 h-7 rounded-lg ring-1 ${style.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon size={14} className={style.iconColor} strokeWidth={2.5} />
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-[13px] text-stone-800 leading-snug">{message}</p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => removeToast(id)}
          className="text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md p-1 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-[2px] ${style.accent} opacity-30`}
      />
    </motion.div>
  )
}