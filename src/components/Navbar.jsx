import { useNavigate } from "react-router-dom";
import { Bell, Search, MapPin } from "lucide-react";
import { useToastStore } from "../store/useToastStore";
import { useAuthStore } from "../store/useAuthStore";
import { useStatsStore } from "../store/useStatsStore";

const ROLE_LABELS = {
  manager: "Manager",
  doctor: "Doctor",
  nurse: "Nurse",
  lab_tech: "Lab Tech",
  receptionist: "Receptionist",
  pharmacy: "Pharmacy",
  staff: "Staff",
};

function titleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getInitials(name) {
  if (!name) return "?";
  const cleaned = titleCase(name).replace(/^Dr\.?\s+/i, "").trim();
  const words = cleaned.split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getShortName(name) {
  if (!name) return "Loading…";
  const titled = titleCase(name);
  const words = titled.trim().split(/\s+/);
  if (words.length <= 2) return titled;
  return words.slice(0, 2).join(" ");
}

export default function Navbar() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const profile = useAuthStore((s) => s.profile);
  const unresolvedFlags = useStatsStore((s) => s.unresolved_flags);

  return (
    <header className="h-16 bg-white/70 backdrop-blur-md border-b border-stone-200 flex items-center gap-4 px-6 flex-shrink-0 sticky top-0 z-30">
      {/* Clinic badge — pill with icon */}
      <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-stone-100 border border-stone-200 rounded-full text-xs font-semibold text-stone-700 flex-shrink-0">
        <div className="w-5 h-5 rounded-full bg-[#0d3a3a] flex items-center justify-center text-white">
          <MapPin size={10} strokeWidth={2.5} />
        </div>
        Klinik Sejahtera PJ
      </div>

      {/* Search — wider, cleaner */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#0d3a3a] transition-colors"
            size={14}
          />
          <input
            type="text"
            placeholder="Search patients, workflows…"
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-transparent rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-300 focus:shadow-sm transition-all"
          />
          {/* Hidden hint for the search keyboard shortcut — adds a small editorial detail */}
          <kbd className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-stone-200/80 text-[9px] font-mono text-stone-500 pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell with pulsing dot when there are flags */}
        <button
          onClick={() => {
            if (unresolvedFlags > 0) {
              navigate("/human-review");
            } else {
              addToast("info", "All caught up — no pending alerts");
            }
          }}
          className="relative w-9 h-9 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
          title={unresolvedFlags > 0 ? `${unresolvedFlags} flags pending` : "No alerts"}
        >
          <Bell size={16} strokeWidth={2} />
          {unresolvedFlags > 0 && (
            <span className="absolute top-2 right-2 flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f97316]" />
            </span>
          )}
        </button>

        <div className="w-px h-6 bg-stone-200 mx-1" />

        {/* User pill */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-stone-100 transition-colors group"
        >
          <div
            className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0d3a3a] to-[#0a4747] flex items-center justify-center text-[10px] text-white flex-shrink-0 shadow-sm"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700 }}
          >
            {getInitials(profile?.full_name)}
          </div>
          <div className="text-left">
            <div className="text-[13px] font-semibold text-stone-800 leading-tight">
              {getShortName(profile?.full_name)}
            </div>
            <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
              {ROLE_LABELS[profile?.role] || "Staff"}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}