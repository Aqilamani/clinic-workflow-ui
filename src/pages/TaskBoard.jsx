import { useState, useEffect, useRef } from "react"
import { Plus, Clock, Check, AlertCircle, RefreshCw, Sparkles, Stethoscope } from "lucide-react"
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
import { motion, AnimatePresence } from "framer-motion"
import { useToastStore } from "../store/useToastStore"
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from "../lib/labels"
import { getAllTasks, updateTaskStatus, subscribeToTasks } from "../api/tasks"

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS = ["todo", "in_progress", "review", "done"]

// Each column gets editorial treatment — accent + tone
const COLUMN_META = {
  todo: {
    accent: "bg-stone-400",
    accentText: "text-stone-700",
    countBg: "bg-stone-100 text-stone-600",
    label: "Backlog",
    sublabel: "Awaiting pickup",
  },
  in_progress: {
    accent: "bg-[#0d3a3a]",
    accentText: "text-[#0d3a3a]",
    countBg: "bg-teal-50 text-teal-800",
    label: "In Motion",
    sublabel: "Active work",
  },
  review: {
    accent: "bg-amber-500",
    accentText: "text-amber-700",
    countBg: "bg-amber-50 text-amber-800",
    label: "On Hold",
    sublabel: "Waiting review",
  },
  done: {
    accent: "bg-emerald-500",
    accentText: "text-emerald-700",
    countBg: "bg-emerald-50 text-emerald-800",
    label: "Completed",
    sublabel: "Workflows closed",
  },
}

// Type pill styles — each task type gets a distinctive but quiet color
const TASK_TYPE_PILLS = {
  appointment:    { bg: "bg-sky-50 text-sky-700 ring-sky-100" },
  lab:            { bg: "bg-teal-50 text-teal-800 ring-teal-100" },
  urgent:         { bg: "bg-orange-50 text-orange-700 ring-orange-200" },
  urgent_walk_in: { bg: "bg-orange-50 text-orange-700 ring-orange-200" },
  follow_up:      { bg: "bg-amber-50 text-amber-700 ring-amber-100" },
  human_review:   { bg: "bg-violet-50 text-violet-700 ring-violet-100" },
  approval:       { bg: "bg-amber-50 text-amber-700 ring-amber-100" },
  missing_data:   { bg: "bg-rose-50 text-rose-700 ring-rose-100" },
  done:           { bg: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
}

const ROLE_COLOR = {
  doctor:       "from-violet-500 to-violet-700",
  nurse:        "from-pink-400 to-rose-600",
  lab_tech:     "from-teal-500 to-teal-700",
  receptionist: "from-sky-400 to-blue-600",
  pharmacy:     "from-orange-400 to-orange-600",
  manager:      "from-stone-700 to-stone-900",
  system:       "from-stone-400 to-stone-600",
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

function titleCase(str) {
  if (!str) return ""
  return str.toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

function getInitials(name) {
  if (!name) return "??"
  const cleaned = titleCase(name).replace(/^Dr\.?\s+/i, "").trim()
  const words = cleaned.split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

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

  const typePill = TASK_TYPE_PILLS[task.task_type] || { bg: "bg-stone-100 text-stone-700 ring-stone-200" }
  const typeLabel = TASK_TYPE_LABELS[task.task_type] || task.task_type
  const isDone = task.status === "done"

  const assigneeName = task.assignee?.full_name
    ? titleCase(task.assignee.full_name)
    : ROLE_LABEL[task.assignee_role] || task.assignee_role
  const roleGradient = ROLE_COLOR[task.assignee_role] || "from-stone-400 to-stone-600"
  const initials = task.assignee?.full_name
    ? getInitials(task.assignee.full_name)
    : (task.assignee_role || "??").slice(0, 2).toUpperCase()

  const patientName = task.workflow?.patient?.full_name
    ? titleCase(task.workflow.patient.full_name)
    : null

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging && onAdvance) onAdvance(task)
      }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-sm hover:shadow-md hover:border-stone-300 transition-shadow cursor-pointer group select-none ${
        isDragging ? "opacity-30" : ""
      } ${isDone ? "opacity-80" : ""}`}
    >
      {/* Completion celebration overlay */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center pointer-events-none z-10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="bg-white rounded-full p-2 shadow-xl"
            >
              <Check size={22} className="text-emerald-500" strokeWidth={3} />
            </motion.div>
            {/* Tiny confetti burst */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 6) * Math.PI * 2) * 50,
                  y: Math.sin((i / 6) * Math.PI * 2) * 50,
                  opacity: 0,
                }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="absolute w-1.5 h-1.5 rounded-full bg-orange-400"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top row: type pill + escalation */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ring-1 ${typePill.bg}`}>
          {typeLabel}
        </span>
        {task.is_escalation && (
          <div className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-orange-700 uppercase tracking-wider">
            <AlertCircle size={10} className="text-orange-600" />
            Escalate
          </div>
        )}
      </div>

      {/* Title — slightly larger, more readable */}
      <p className="text-[13px] font-semibold text-stone-900 leading-snug mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Patient — with serif accent */}
      {patientName && (
        <div className="flex items-center gap-1.5 mb-3 pb-2.5 border-b border-stone-100">
          <Stethoscope size={10} className="text-stone-400 flex-shrink-0" />
          <p className="text-[11px] text-stone-500 truncate">
            <span className="text-stone-800" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 500 }}>
              {patientName}
            </span>
          </p>
        </div>
      )}

      {/* Bottom: assignee + meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-full bg-gradient-to-br ${roleGradient} flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 shadow-sm`}
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {initials}
          </div>
          <span className="text-[11px] text-stone-600 truncate">{assigneeName}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {task.requires_human_action ? (
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Manual</span>
          ) : (
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Auto</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Column ──────────────────────────────────────────────────────────────────

function Column({ colId, tasks, onAdvance, justCompletedIds, index }) {
  const { isOver, setNodeRef } = useDroppable({ id: colId })
  const meta = COLUMN_META[colId]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      ref={setNodeRef}
      className={`relative rounded-2xl p-4 border-2 transition-all ${
        isOver
          ? "bg-orange-50/60 border-orange-300 border-dashed"
          : "bg-stone-100/70 border-transparent"
      }`}
    >
      {/* Column header — editorial style */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${meta.accent}`} />
            <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-stone-500">
              {meta.sublabel}
            </p>
          </div>
          <h3
            className={`text-xl font-bold leading-none ${meta.accentText}`}
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" }}
          >
            {meta.label}
          </h3>
        </div>
        <span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${meta.countBg}`}
        >
          {String(tasks.length).padStart(2, "0")}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-2 min-h-[100px]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center mb-2">
              <Plus size={14} className="text-stone-400" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              {colId === "done" ? "Nothing closed yet" : isOver ? "Drop here" : "Empty"}
            </p>
          </div>
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
    </motion.div>
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const columns = groupByStatus(tasks)
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
    }, 1400)
  }

  const moveTask = async (task, newStatus) => {
    if (!newStatus || task.status === newStatus) return
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
      setTasks(previous)
      addToast("warn", err.message || "Failed to update task")
    }
  }

  const handleAdvance = (task) => {
    const next = nextStatus(task.status)
    if (!next) {
      addToast("info", "Already complete")
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

  const totalActive = tasks.filter(t => t.status !== "done").length

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
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-2 flex items-center gap-2">
            <RealtimePill status={realtimeStatus} />
            <span>Task Board</span>
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold text-stone-900 leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
          >
            <span className="italic font-light text-stone-500">Today's</span>{" "}
            assignments
          </h1>
          <p className="text-sm text-stone-500 mt-2 max-w-md">
            <span className="font-semibold text-stone-700">{totalActive}</span>{" "}
            task{totalActive === 1 ? "" : "s"} active across the clinic. Click to advance, or drag between columns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTasks}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 rounded-xl text-sm font-semibold hover:border-stone-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => addToast("info", "Quick task creation coming soon")}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors active:scale-[0.98]"
          >
            <Plus size={15} /> New Task
          </button>
        </div>
      </motion.div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-stone-200 border-t-[#0d3a3a] rounded-full animate-spin" />
            <span className="text-sm font-mono text-stone-500">Loading tasks…</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <AlertCircle size={32} className="text-orange-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Couldn't load tasks
          </h3>
          <p className="text-sm text-stone-500 mt-1">{error}</p>
          <button
            onClick={loadTasks}
            className="mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
          <Sparkles size={32} className="text-orange-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Nothing on the board yet
          </h3>
          <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Approve a workflow from the Queue and its tasks will appear here for staff to action.
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
            {COLUMNS.map((colId, i) => (
              <Column
                key={colId}
                colId={colId}
                tasks={columns[colId]}
                onAdvance={handleAdvance}
                justCompletedIds={justCompletedIds}
                index={i}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeDragTask ? (
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 3 }}
                className="bg-white rounded-xl border-2 border-orange-300 p-3.5 shadow-2xl shadow-orange-200/40 cursor-grabbing"
              >
                <p className="text-[13px] font-semibold text-stone-900 leading-snug">
                  {activeDragTask.title}
                </p>
                {activeDragTask.workflow?.patient?.full_name && (
                  <p
                    className="text-[11px] text-stone-500 mt-1 italic"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    {titleCase(activeDragTask.workflow.patient.full_name)}
                  </p>
                )}
              </motion.div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

// ─── Realtime status pill (compact, used in header) ──────────────────────────

function RealtimePill({ status }) {
  const colors = {
    connecting: "bg-amber-400",
    live: "bg-emerald-500",
    offline: "bg-stone-400",
  }
  const dotColor = colors[status] || colors.offline
  return (
    <span className="inline-flex items-center gap-1">
      <span className="relative flex w-1.5 h-1.5">
        {status === "live" && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-60 animate-ping`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
      </span>
      <span className="text-stone-400">•</span>
    </span>
  )
}