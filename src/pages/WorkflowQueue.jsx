import { useState, useEffect } from "react"
import { Search, Clock, CheckCircle2, AlertCircle, PlayCircle, MoreHorizontal, ArrowRight, RefreshCw } from "lucide-react"
import { useToastStore } from "../store/useToastStore"
import { WORKFLOW_STATUS_LABELS, WORKFLOW_PRIORITY_LABELS } from "../lib/labels"
import { getWorkflows, approveWorkflow } from "../api/workflows"

const FILTER_TABS = [
  { value: "all",            label: "All" },
  { value: "pending_review", label: "Pending Review" },
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

function shortId(uuid) {
  return uuid ? `WF-${uuid.slice(0, 8).toUpperCase()}` : ""
}

function timeAgo(iso) {
  if (!iso) return ""
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
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
      setError(err.message || "Failed to load workflows")
      console.error("getWorkflows failed:", err)
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
      addToast("success", `Workflow ${shortId(id)} approved and moved to Active.`)
    } catch (err) {
      addToast("warn", err.message || "Failed to approve workflow")
    } finally {
      setApprovingId(null)
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case "active":         return "bg-blue-50 text-blue-700 border-blue-200"
      case "pending_review": return "bg-amber-50 text-amber-700 border-amber-200"
      case "delayed":        return "bg-red-50 text-red-700 border-red-200"
      case "completed":      return "bg-emerald-50 text-emerald-700 border-emerald-200"
      default:               return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":         return <PlayCircle size={14} className="mr-1.5" />
      case "pending_review": return <Clock size={14} className="mr-1.5" />
      case "delayed":        return <AlertCircle size={14} className="mr-1.5" />
      case "completed":      return <CheckCircle2 size={14} className="mr-1.5" />
      default:               return null
    }
  }

  const filteredWorkflows = workflows.filter((wf) => {
    const patientName = wf.patient?.full_name || ""
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          wf.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "all" || wf.status === activeTab
    return matchesSearch && matchesTab
  })

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workflow Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage, approve, and track all active patient workflows in the clinic.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ID or Patient..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={loadWorkflows}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto">
        {FILTER_TABS.map((tab) => {
          const count = tab.value === "all"
            ? workflows.length
            : workflows.filter((w) => w.status === tab.value).length
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === tab.value ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {count}
                </span>
              )}
              {activeTab === tab.value && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[140px_2fr_1.5fr_1.5fr_1fr_100px] gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div>ID</div>
          <div>Patient & Type</div>
          <div>Status</div>
          <div>Progress</div>
          <div>Created</div>
          <div className="text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Failed to load workflows</p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
              <button
                onClick={loadWorkflows}
                className="mt-3 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-md transition-colors"
              >
                Try again
              </button>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              {workflows.length === 0
                ? "No workflows yet. Create one from the Dashboard or New Workflow page."
                : "No workflows found matching your criteria."}
            </div>
          ) : (
            filteredWorkflows.map((wf) => {
              const progress = wf.total_tasks > 0
                ? Math.round((wf.completed_tasks / wf.total_tasks) * 100)
                : 0
              return (
                <div key={wf.id} className="grid grid-cols-[140px_2fr_1.5fr_1.5fr_1fr_100px] gap-4 p-4 items-center hover:bg-slate-50 transition-colors group">
                  <div className="text-sm font-mono font-medium text-slate-600 truncate" title={wf.id}>
                    {shortId(wf.id)}
                  </div>
                  
                  <div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {wf.patient?.full_name || "Unknown patient"}
                      {wf.priority === "high" && (
                        <span className="w-2 h-2 rounded-full bg-red-500" title={WORKFLOW_PRIORITY_LABELS.high}></span>
                      )}
                      {wf.priority === "urgent" && (
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" title={WORKFLOW_PRIORITY_LABELS.urgent}></span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{TYPE_LABELS[wf.type] || wf.type}</div>
                  </div>

                  <div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(wf.status)}`}>
                      {getStatusIcon(wf.status)}
                      {WORKFLOW_STATUS_LABELS[wf.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-600 font-medium whitespace-nowrap">
                      {wf.completed_tasks}/{wf.total_tasks} steps
                    </div>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${wf.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-slate-500">{timeAgo(wf.created_at)}</div>

                  <div className="flex items-center justify-end gap-2">
                    {wf.status === "pending_review" ? (
                      <button 
                        onClick={() => handleApprove(wf.id)}
                        disabled={approvingId === wf.id}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-md transition-colors disabled:opacity-60"
                      >
                        {approvingId === wf.id ? "..." : "Approve"}
                      </button>
                    ) : (
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                        <ArrowRight size={16} />
                      </button>
                    )}
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}