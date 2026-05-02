function ReviewCard({ item }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-800">{item.title}</h3>
          <p className="text-sm text-slate-500 mt-1">{item.type}</p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Review Needed
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Issue</p>
          <p className="text-sm text-slate-600">{item.issue}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">AI Recommendation</p>
          <p className="text-sm text-slate-600">{item.recommendation}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Missing Info</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {item.missing.map((field, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700">
          Approve
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
          Request Info
        </button>
        <button className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-300">
          Reassign
        </button>
      </div>
    </div>
  )
}

function HumanReviewPanel() {
  const reviewItems = [
    {
      title: "Walk-In Chest Pain Case",
      type: "Urgent Walk-In",
      issue: "Urgent symptoms detected. Patient identity incomplete.",
      recommendation:
        "Notify duty doctor immediately and continue triage in parallel while receptionist collects identity details.",
      missing: ["Full Name", "IC Number", "Contact Number"],
    },
    {
      title: "Aisyah Fever Appointment",
      type: "Appointment Request",
      issue: "Preferred slot may be unavailable and guardian contact is incomplete.",
      recommendation:
        "Offer three alternative morning slots and request guardian contact before confirmation.",
      missing: ["Guardian Contact"],
    },
  ]

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Human Review Queue</h2>
        <span className="text-sm text-slate-500">
          Cases requiring human approval
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {reviewItems.map((item, index) => (
          <ReviewCard key={index} item={item} />
        ))}
      </div>
    </div>
  )
}

export default HumanReviewPanel