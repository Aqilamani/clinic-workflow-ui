import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, PlusSquare, ListTodo, KanbanSquare, Users, Activity 
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useStatsStore } from "../store/useStatsStore";

const ROLE_LABELS = {
  manager: "Clinic Manager",
  doctor: "Doctor",
  nurse: "Nurse",
  lab_tech: "Lab Technician",
  receptionist: "Receptionist",
  pharmacy: "Pharmacy",
  staff: "Staff",
};

// Title-case names so "AQIL BIN MISNI" → "Aqil Bin Misni"
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

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfileActive = location.pathname === "/profile";
  const profile = useAuthStore((s) => s.profile);

  const queueCount = useStatsStore((s) => s.pending_review);
  const reviewCount = useStatsStore((s) => s.unresolved_flags);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/new-workflow", label: "New Workflow", icon: PlusSquare },
    { path: "/queue", label: "Workflow Queue", icon: ListTodo, badge: queueCount },
    { path: "/task-board", label: "Task Board", icon: KanbanSquare },
    { path: "/human-review", label: "Human Review", icon: Users, badge: reviewCount, urgent: true },
  ];

  return (
    <aside className="w-[260px] bg-stone-100 border-r border-stone-200 text-stone-700 flex flex-col flex-shrink-0 h-full">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-stone-200/80 gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d3a3a] to-[#082929] flex items-center justify-center shadow-md">
          <Activity size={18} className="text-orange-400" strokeWidth={2.5} />
        </div>
        <div>
          <h1
            className="text-stone-900 leading-tight text-[17px]"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontVariationSettings: "'opsz' 144" }}
          >
            ClinicFlow
          </h1>
          <p className="text-[9px] font-mono text-stone-500 tracking-[0.18em] uppercase mt-0.5">
            Workflow Manager
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-mono font-semibold text-stone-400 uppercase tracking-[0.2em] mb-3">
          Main
        </p>

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm group ${
                isActive
                  ? "bg-white text-stone-900 shadow-sm shadow-stone-200/60 font-semibold"
                  : "text-stone-600 hover:bg-white/60 hover:text-stone-900 font-medium"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bar"
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#f97316]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-3 ml-1">
                  <item.icon
                    size={17}
                    className={`transition-colors ${
                      isActive ? "text-[#0d3a3a]" : "text-stone-400 group-hover:text-stone-700"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.label}
                </div>
                {item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={item.badge}
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                      item.urgent
                        ? "bg-orange-100 text-orange-700 ring-1 ring-orange-200"
                        : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                    }`}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom area */}
      <div className="p-3 border-t border-stone-200/80 flex-shrink-0 space-y-2">
        {/* GLM status pill */}
        <div className="px-3 py-2 bg-white/70 rounded-xl flex items-center gap-2 border border-stone-200/60">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-stone-600 font-medium">GLM Engine</span>
          <span className="ml-auto text-[10px] font-mono text-stone-400 uppercase tracking-wider">Live</span>
        </div>

        {/* Profile button */}
        <button
          onClick={() => navigate("/profile")}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors group ${
            isProfileActive
              ? "bg-white shadow-sm shadow-stone-200/60"
              : "hover:bg-white/60"
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d3a3a] to-[#0a4747] flex items-center justify-center text-white text-xs flex-shrink-0 shadow-sm" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700 }}>
            {getInitials(profile?.full_name)}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-900 leading-tight truncate">
              {titleCase(profile?.full_name) || "Loading…"}
            </p>
            <p className="text-[11px] text-stone-500 truncate">
              {ROLE_LABELS[profile?.role] || "Staff"}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}