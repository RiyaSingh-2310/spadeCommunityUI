import {
  BarChart3,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Layers3,
  Moon,
  Sun,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/survey-research", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/survey-research/pre-screener-groups", label: "Pre-Screener Groups", icon: Layers3 },
  { to: "/survey-research/projects", label: "Project & Survey", icon: FolderKanban },
  { to: "/survey-research/analytics", label: "Survey Analytics", icon: BarChart3 },
];

function SurveyResearchSidebar({ isDarkMode, onToggleTheme, isMobile, isOpen, onClose }) {
  const sidebarClass = isMobile
    ? `fixed inset-y-0 left-0 z-[120] w-[280px] transform transition-transform duration-200 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`
    : "fixed inset-y-0 left-0 z-[100] w-[270px]";

  return (
    <aside className={sidebarClass} style={{ background: "var(--srp-sidebar-bg)" }}>
      <div className="flex h-full flex-col px-4 py-5">
        <div className="mb-8 px-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">ResearchOS</p>
          <h1 className="mt-2 text-lg font-semibold text-white">Survey Intelligence</h1>
          <p className="mt-1 text-xs text-slate-400">Enterprise research operations</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-200"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            onClick={onToggleTheme}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <div className="rounded-xl bg-white/5 px-3 py-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-200">
              <ClipboardList size={14} />
              Demo environment
            </div>
            <p className="mt-1">Frontend mock data only</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SurveyResearchSidebar;
