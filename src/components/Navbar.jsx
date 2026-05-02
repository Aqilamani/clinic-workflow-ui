import { useNavigate } from "react-router-dom";
import { useToastStore } from "../store/useToastStore";
import { useAuthStore } from "../store/useAuthStore";

const ROLE_LABELS = {
  manager: "Manager",
  doctor: "Doctor",
  nurse: "Nurse",
  lab_tech: "Lab Tech",
  receptionist: "Receptionist",
  pharmacy: "Pharmacy",
  staff: "Staff",
};

function getInitials(name) {
  if (!name) return "?";
  const words = name.replace(/^Dr\.?\s+/i, "").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Get a short display name (e.g. "Dr. Siti Rahimah" → "Dr. Siti")
function getShortName(name) {
  if (!name) return "Loading…";
  const words = name.trim().split(/\s+/);
  if (words.length <= 2) return name;
  return words.slice(0, 2).join(" ");
}

export default function Navbar() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const profile = useAuthStore((s) => s.profile);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-5 flex-shrink-0 sticky top-0 z-30 shadow-sm">
      {/* Clinic badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-700 flex-shrink-0">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
        Klinik Sejahtera PJ
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search patients, workflows…"
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-transparent rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => addToast("info", "3 pending alerts require your attention")}
          className="relative w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {getInitials(profile?.full_name)}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {getShortName(profile?.full_name)}
            </div>
            <div className="text-[10px] text-slate-400">
              {ROLE_LABELS[profile?.role] || "Staff"}
            </div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </header>
  );
}