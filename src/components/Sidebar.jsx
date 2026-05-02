import { NavLink, useNavigate, useLocation } from "react-router-dom";
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

function getInitials(name) {
  if (!name) return "?";
  const words = name.replace(/^Dr\.?\s+/i, "").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfileActive = location.pathname === "/profile";
  const profile = useAuthStore((s) => s.profile);

  // Live counts — update automatically via realtime
  const queueCount = useStatsStore((s) => s.pending_review);
  const reviewCount = useStatsStore((s) => s.unresolved_flags);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/new-workflow", label: "New Workflow", icon: PlusSquare },
    { path: "/queue", label: "Workflow Queue", icon: ListTodo, badge: queueCount, badgeColor: "bg-amber-500" },
    { path: "/task-board", label: "Task Board", icon: KanbanSquare },
    { path: "/human-review", label: "Human Review", icon: Users, badge: reviewCount, badgeColor: "bg-red-500" },
  ];

  return (
    <aside className="w-[260px] bg-[#111827] text-slate-300 flex flex-col flex-shrink-0 h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
          <Activity size={20} />
        </div>
        <div>
          <h1 className="text-white font-bold leading-tight">ClinicFlow AI</h1>
          <p className="text-[10px] text-slate-400 tracking-widest uppercase">Workflow Manager</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Main</p>
        
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                  {item.label}
                </div>
                {/* Only render badge when count > 0 */}
                {item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${item.badgeColor || "bg-amber-500"}`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom User Area */}
      <div className="p-4 border-t border-slate-800 space-y-4 flex-shrink-0">
        <div className="px-3 py-2 bg-slate-800/50 rounded-lg flex items-center gap-2 border border-slate-700/50">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-slate-300">GLM Engine - Online</span>
        </div>

        <button
          onClick={() => navigate("/profile")}
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors cursor-pointer ${
            isProfileActive 
              ? "bg-slate-800 ring-1 ring-slate-700" 
              : "hover:bg-slate-800/60"
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {getInitials(profile?.full_name)}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">
              {profile?.full_name || "Loading…"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {ROLE_LABELS[profile?.role] || "Staff"}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}