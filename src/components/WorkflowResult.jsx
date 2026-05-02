// src/components/WorkflowResult.jsx
// Fixed: removed lucide-react dependency (inline SVGs)
// Added: type-aware step colors, missing data banner, approve/edit/escalate buttons

function StepCard({ step, index, isLast }) {
  // Color the step based on whether it needs human input or is urgent
  const isUrgent = step.title.toLowerCase().includes("urgent") || step.title.toLowerCase().includes("notify")
  const isHuman = step.escalation

  const bubbleClass = isUrgent
    ? "bg-red-500 border-red-500 text-white"
    : isHuman
    ? "bg-amber-400 border-amber-400 text-white"
    : "bg-white border-blue-400 text-blue-600"

  const cardClass = isUrgent
    ? "bg-red-50 border-red-200"
    : isHuman
    ? "bg-amber-50 border-amber-200"
    : "bg-slate-50 border-slate-200"

  return (
    <div className="flex gap-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 ${bubbleClass}`}>
          {index + 1}
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 rounded-lg p-3 mb-2 border ${cardClass}`}>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{step.title}</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 whitespace-nowrap">
            {step.role}
          </span>
        </div>

        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            ⏱ {step.time}
          </span>
          {step.escalation && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
              👤 Human Review Required
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WorkflowResult({ data, onApprove, onReset }) {
  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center p-10">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-600 mb-1">No Workflow Yet</h3>
          <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed mx-auto">
            Enter any clinic input on the left and GLM will generate a structured workflow.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">GLM Generated</span>
            </div>
            <h3 className="text-sm font-bold text-slate-800">{data.title}</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              data.urgency === "High" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
            }`}>
              {data.urgency} Priority
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              {data.status}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Meta grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Patient", value: data.patient },
            { label: "Urgency", value: data.urgency },
            { label: "Missing Info", value: data.missingInfo || "None" },
          ].map((m) => (
            <div key={m.label} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-semibold mb-0.5">{m.label}</p>
              <p className={`text-xs font-bold ${
                m.label === "Missing Info" && m.value !== "None" ? "text-red-600" : "text-slate-800"
              }`}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Missing info warning */}
        {data.missingInfo && data.missingInfo !== "None" && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <span className="text-red-500 mt-0.5 text-sm">⚠</span>
            <div>
              <p className="text-xs font-bold text-red-700">Missing Information Detected</p>
              <p className="text-xs text-red-600 mt-0.5">{data.missingInfo}</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">AI Summary</p>
          <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/60 border border-blue-100 rounded-lg p-3">
            {data.summary}
          </p>
        </div>

        {/* Steps */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
            Workflow Steps · {data.steps.length} total
          </p>
          {data.steps.map((step, i) => (
            <StepCard
              key={i}
              step={step}
              index={i}
              isLast={i === data.steps.length - 1}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={onApprove}
            className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-[0.97] transition-all"
          >
            ✓ Approve & Activate
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            ✎ Edit
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors">
            ↑ Escalate
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            ↺ Reset
          </button>
        </div>
      </div>
    </div>
  )
}
