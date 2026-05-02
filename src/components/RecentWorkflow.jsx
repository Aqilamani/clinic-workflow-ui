import { Plus, Filter } from "lucide-react"

const ROWS = [
  { id: "WF-089", patient: "Ahmad bin Ismail", sub: "Chest pain consultation", type: "Walk-In", typeColor: "bg-red-100 text-red-700", status: "Active", statusColor: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", assigned: "Dr. Rahman", av: "DR", avBg: "bg-blue-500", updated: "5 min ago" },
  { id: "WF-088", patient: "Priya a/p Suresh", sub: "FBC + Lipid panel lab order", type: "Lab", typeColor: "bg-blue-100 text-blue-700", status: "Awaiting Results", statusColor: "bg-purple-100 text-purple-700", dot: "bg-purple-500", assigned: "Lab Team", av: "LB", avBg: "bg-emerald-600", updated: "22 min ago" },
  { id: "WF-087", patient: "Lim Wei Hong", sub: "Routine check-up appointment", type: "Appointment", typeColor: "bg-slate-100 text-slate-600", status: "Pending Review", statusColor: "bg-amber-100 text-amber-700", dot: "bg-amber-500", assigned: "Nurse Ros", av: "NR", avBg: "bg-violet-500", updated: "45 min ago" },
  { id: "WF-086", patient: "Fatimah Zahra", sub: "Paediatric fever — 8yo", type: "Appointment", typeColor: "bg-slate-100 text-slate-600", status: "Active", statusColor: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", assigned: "Dr. Aisha", av: "DA", avBg: "bg-amber-500", updated: "1 hr ago" },
  { id: "WF-085", patient: "Rajasegaran s/o Munisamy", sub: "Specialist referral — cardiology", type: "Referral", typeColor: "bg-violet-100 text-violet-700", status: "Completed", statusColor: "bg-slate-100 text-slate-500", dot: "bg-slate-400", assigned: "Dr. Rahman", av: "DR", avBg: "bg-blue-500", updated: "2 hr ago" },
  { id: "WF-084", patient: "Wong Mei Ling", sub: "Elderly fall — wrist injury", type: "Walk-In", typeColor: "bg-red-100 text-red-700", status: "Completed", statusColor: "bg-slate-100 text-slate-500", dot: "bg-slate-400", assigned: "Nurse Ros", av: "NR", avBg: "bg-violet-500", updated: "3 hr ago" },
]

export default function RecentWorkflows({ navigate, PAGES }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Recent Workflows</h3>
          <p className="text-[11px] text-slate-500">All active and recently completed workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={12} /> Filter
          </button>
          <button
            onClick={() => navigate(PAGES.NEW_WORKFLOW)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            <Plus size={12} /> New
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              {["Workflow ID", "Patient / Request", "Type", "Status", "Assigned To", "Updated"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide text-[10px] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr
                key={r.id}
                className={`border-b border-slate-50 hover:bg-blue-50/40 transition-colors cursor-pointer ${i === ROWS.length - 1 ? "border-b-0" : ""}`}
              >
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-blue-600 text-[11px]">WF-2024-{r.id.split("-")[1]}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{r.patient}</p>
                  <p className="text-slate-400 text-[11px]">{r.sub}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.typeColor}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${r.statusColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full ${r.avBg} flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0`}>
                      {r.av}
                    </div>
                    <span className="text-slate-700 whitespace-nowrap">{r.assigned}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}