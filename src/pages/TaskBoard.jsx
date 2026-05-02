import { useState, useEffect, useRef } from "react"
import { Plus, Clock, Check, AlertCircle, RefreshCw } from "lucide-react"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core"
import { useToastStore } from "../store/useToastStore"
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from "../lib/labels"
import { getAllTasks, updateTaskStatus, subscribeToTasks } from "../api/tasks"

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS = ["todo", "in_progress", "review", "done"]

const COLUMN_META = {
  todo:        { countColor: "text-slate-500 bg-slate-100" },
  in_progress: { countColor: "text-blue-700 bg-blue-100" },
  review:      { countColor: "text-violet-700 bg-violet-100" },
  done:        { countColor: "text-emerald-700 bg-emerald-100" },
}

const TASK_TYPE_COLORS = {
  appointment:    "bg-blue-100 text-blue-700",
  lab:            "bg-teal-100 text-teal-700",
  urgent:         "bg-red-100 text-red-700",
  urgent_walk_in: "bg-red-100 text-red-700",
  follow_up:      "bg-amber-100 text-amber-700",
  human_review:   "bg-violet-100 text-violet-700",
  approval:       "bg-amber-100 text-amber-700",
  missing_data:   "bg-red-100 text-red-700",
  done:           "bg-emerald-100 text-emerald-700",
}

const ROLE_AVATAR_BG = {
  doctor:       "bg-violet-600",
  nurse:        "bg-violet-500",
  lab_tech:     "bg-teal-600",
  receptionist: "bg-blue-500",
  pharmacy:     "bg-orange-500",
  manager:      "bg-blue-600",
  system:       "bg-slate-500",
}

const ROLE_LABEL = {
  doctor: "Doctor", nurse: "Nurse", lab_tech: "Lab Tech",
  receptionist: "Receptionist", pharmacy: "Pharmacy",
  manager: "Manager", system: "System", staff: "Staff",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextStatus(current) {
  const i = COLUMNS.indexOf(current)
  if (i < 0 || i === COLUMNS.length - 1) return null
  return COLUMNS[i + 1]
}

function getInitials(name) {
  if (!name) return "??"
  const words = name.replace(/^Dr\.?\s+/i, "").trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

// Group a flat tasks array into { todo: [...], in_progress: [...], ... }
function groupByStatus(tasks) {
  const groups = { todo: [], in_progress: [], review: [], done: [] }
  tasks.forEach((t) => {
    if (groups[t.status]) groups[t.status].push(t)
  })
  Object.values(groups).forEach((arr) =>
    arr.sort((a, b) => a.order_index - b.order_index || new Date(a.created_at) - new Date(b.created_at))
  )
  return groups
}

// ─── Card ────────────────────────────────────────────────────────────────────

function TaskCard({ task, onAdvance, justCompleted }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const typeColor = TASK_TYPE_COLORS[task.task_type] || "bg-slate-100 text-slate-700"
  const typeLabel = TASK_TYPE_LABELS[task.task_type] || task.task_type
  const isDone = task.status === "done"

  const assigneeName = task.assignee?.full_name || ROLE_LABEL[task.assignee_role] || task.assignee_role
  const avatarBg = ROLE_AVATAR_BG[task.assignee_role] || "bg-slate-500"
  const initials = task.assignee?.full_name
    ? getInitials(task.assignee.full_name)
    : (task.assignee_role || "??").slice(0, 2).toUpperCase()

  const patientName = task.workflow?.patient?.full_name || "—"

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging && onAdvance) onAdvance(task)
      }}
      className={`relative bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none ${
        isDragging ? "opacity-30" : ""
      } ${isDone ? "opacity-70" : ""}`}
    >
      {/* Celebration overlay */}
      {justCompleted && (
        <div className="absolute inset-0 bg-emerald-500/90 rounded-lg flex items-center justify-center animate-fade-out pointer-events-none z-10">
          <div className="bg-white rounded-full p-2 shadow-lg">
            <Check size={20} className="text-emerald-500" strokeWidth={3} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColor} inline-block`}>
          {typeLabel}
        </span>
        {task.is_escalation && (
          <AlertCircle size={11} className="text-red-500 flex-shrink-0" />
        )}
      </div>

      <p className="text-xs font-semibold text-slate-800 leading-snug mb-1.5 line-clamp-2">
        {task.title}
      </p>

      {patientName !== "—" && (
        <p className="text-[10px] text-slate-500 mb-2 truncate">
          Patient: <span className="text-slate-700 font-medium">{patientName}</span>
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-5 h-5 rounded-full ${avatarBg} flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0`}>
            {initials}
          </div>
          <span className="text-[10px] text-slate-500 truncate">{assigneeName}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Clock size={9} className="text-slate-400" />
          <span className="text-[10px] text-slate-400">
            {task.requires_human_action ? "Manual" : "Auto"}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Column ──────────────────────────────────────────────────────────────────

function Column({ colId, tasks, onAdvance, justCompletedIds }) {
  const { isOver, setNodeRef } = useDroppable({ id: colId })

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-100 rounded-xl p-3 border transition-colors ${
        isOver ? "border-blue-400 bg-blue-50/50" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          {TASK_STATUS_LABELS[colId]}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${COLUMN_META[colId].countColor}`}>
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2 min-h-[80px]">
        {tasks.length === 0 ? (
          <p className="text-[11px] text-slate-400 text-center py-6 italic">
            Drop tasks here
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onAdvance={onAdvance}
              justCompleted={justCompletedIds.has(task.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function TaskBoard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDragTask, setActiveDragTask] = useState(null)
  const [justCompletedIds, setJustCompletedIds] = useState(new Set())
  const [realtimeStatus, setRealtimeStatus] = useState("connecting")

  const addToast = useToastStore((s) => s.addToast)

  // Require a small drag distance so click-to-advance still works
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const columns = groupByStatus(tasks)

  // Track which task IDs we've already animated — prevents re-triggering
  const seenDoneRef = useRef(new Set())

  const loadTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllTasks()
      setTasks(data)
      data.forEach((t) => {
        if (t.status === "done") seenDoneRef.current.add(t.id)
      })
    } catch (err) {
      setError(err.message || "Failed to load tasks")
      console.error("getAllTasks failed:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()

    setRealtimeStatus("connecting")
    const unsubscribe = subscribeToTasks((change) => {
      setRealtimeStatus("live")

      if (change.eventType === "INSERT") {
        // Realtime payload only has table columns — refetch to get joined data
        loadTasks()
      } else if (change.eventType === "UPDATE") {
        const updated = change.new
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
        )
        if (updated.status === "done" && !seenDoneRef.current.has(updated.id)) {
          triggerCelebration(updated.id)
        }
      } else if (change.eventType === "DELETE") {
        setTasks((prev) => prev.filter((t) => t.id !== change.old.id))
      }
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const triggerCelebration = (taskId) => {
    seenDoneRef.current.add(taskId)
    setJustCompletedIds((prev) => new Set(prev).add(taskId))
    setTimeout(() => {
      setJustCompletedIds((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }, 1500)
  }

  const moveTask = async (task, newStatus) => {
    if (!newStatus || task.status === newStatus) return

    // Optimistic update
    const previous = tasks
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    )

    if (newStatus === "done" && !seenDoneRef.current.has(task.id)) {
      triggerCelebration(task.id)
    }

    try {
      await updateTaskStatus(task.id, newStatus)
    } catch (err) {
      setTasks(previous)  // rollback
      addToast("warn", err.message || "Failed to update task")
      console.error("updateTaskStatus failed:", err)
    }
  }

  const handleAdvance = (task) => {
    const next = nextStatus(task.status)
    if (!next) {
      addToast("info", "Task is already completed")
      return
    }
    moveTask(task, next)
  }

  const handleDragStart = (event) => {
    setActiveDragTask(event.active.data.current?.task || null)
  }

  const handleDragEnd = (event) => {
    setActiveDragTask(null)
    const { active, over } = event
    if (!over) return

    const task = active.data.current?.task
    const newStatus = over.id

    if (task && COLUMNS.includes(newStatus) && task.status !== newStatus) {
      moveTask(task, newStatus)
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-5 pb-12">
      <style>{`
        @keyframes fade-out {
          0%   { opacity: 0; transform: scale(0.7); }
          15%  { opacity: 1; transform: scale(1.05); }
          30%  { opacity: 1; transform: scale(1); }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-out { animation: fade-out 1.5s ease-out forwards; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Board</h1>
            <RealtimeBadge status={realtimeStatus} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Click a card to advance, or drag between columns. Updates sync across all devices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTasks}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => addToast("info", "Quick task creation — coming soon")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Failed to load tasks</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
          <button
            onClick={loadTasks}
            className="mt-3 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-md transition-colors"
          >
            Try again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm font-semibold text-slate-700">No tasks yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Approve a workflow from the Queue to populate the task board.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {COLUMNS.map((colId) => (
              <Column
                key={colId}
                colId={colId}
                tasks={columns[colId]}
                onAdvance={handleAdvance}
                justCompletedIds={justCompletedIds}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragTask ? (
              <div className="bg-white rounded-lg border-2 border-blue-400 p-3 shadow-2xl rotate-2 cursor-grabbing">
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  {activeDragTask.title}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

function RealtimeBadge({ status }) {
  const configs = {
    connecting: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Connecting…" },
    live:       { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Live" },
    offline:    { color: "bg-slate-100 text-slate-600 border-slate-200", label: "Offline" },
  }
  const config = configs[status] || configs.offline

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === "live" ? "bg-emerald-500" : status === "connecting" ? "bg-amber-500 animate-pulse" : "bg-slate-400"
      }`} />
      {config.label}
    </span>
  )
}