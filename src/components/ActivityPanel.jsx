import { AlertTriangle, AlertCircle, Info, Activity } from "lucide-react"

const ALERTS = [
  { type: "danger", icon: AlertCircle, title: "Workflow Stalled — WF-089", desc: "Step 2 overdue by 8 min", time: "5 min ago" },
  { type: "warn", icon: AlertTriangle, title: "Missing Data — Walk-in Elderly", desc: "IC & contact unresolved", time: "12 min ago" },
  { type: "info", icon: Info, title: "Lab Results Ready — Rajan", desc: "FBC results uploaded", time: "18 min ago" },
]

const FEED = [
  { dot: "bg-emerald-500", text: "GLM generated workflow for Ahmad bin Ismail", time: "2:14 PM · URGENT template" },
  { dot: "bg-blue-500", text: "Nurse Ros marked vitals complete — Fatimah Zahra", time: "2:10 PM · Step 2/5" },
  { dot: "bg-amber-500", text: "Escalation triggered — elderly walk-in", time: "2:02 PM · Pending manager" },
  { dot: "bg-emerald-500", text: "Dr. Rahman approved referral — Rajasegaran", time: "1:58 PM · Cardiology IJN" },
  { dot: "bg-teal-500", text: "Lab results entered — Tan Bee Leng thyroid", time: "1:44 PM · Critical value flagged" },
  { dot: "bg-emerald-500", text: "Workflow completed — Wong Mei Ling", time: "1:32 PM · Discharge done" },
]

const alertStyles = {
  danger: { bg: "bg-red-50", iconBg: "bg-red-100", iconColor: "text-red-600" },
  warn: { bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  info: { bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
}

export default function ActivityPanel({ addToast }) {
  return (
    <div className="flex flex-col gap-4">
      {/* GLM Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">GLM Engine Status</span>
          <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Online</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[["Workflows Today", "34"], ["Avg Gen Time", "2.3s"], ["Accuracy Rate", "98.2%"], ["Escalations", "3"]].map(([l, v]) => (
            <div key={l} className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-[10px] text-slate-400 mb-0.5">{l}</p>
              <p className="text-sm font-black text-slate-800">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertCircle size={13} className="text-red-500" />
            <span className="text-xs font-bold text-slate-800">Active Alerts</span>
          </div>
          <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">3</span>
        </div>
        <div>
          {ALERTS.map((a) => {
            const Icon = a.icon
            const s = alertStyles[a.type]
            return (
              <div key={a.title} className={`flex items-start gap-2.5 px-4 py-3 border-b border-slate-50 last:border-b-0 ${s.bg} hover:brightness-95 transition cursor-pointer`} onClick={() => addToast(a.type === "danger" ? "warn" : a.type, a.title)}>
                <div className={`w-6 h-6 rounded-md ${s.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={12} className={s.iconColor} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{a.title}</p>
                  <p className="text-[11px] text-slate-500">{a.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <Activity size={13} className="text-blue-500" />
          <span className="text-xs font-bold text-slate-800">Activity Feed</span>
          <button className="ml-auto text-[10px] font-semibold text-blue-600 hover:underline">View All</button>
        </div>
        <div>
          {FEED.map((f, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition">
              <span className={`w-2 h-2 rounded-full ${f.dot} mt-1.5 flex-shrink-0`} />
              <div>
                <p className="text-xs text-slate-700 leading-snug">{f.text}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{f.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
