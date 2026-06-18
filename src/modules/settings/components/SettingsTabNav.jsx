import { Bell, ClipboardList, Settings, User } from "lucide-react";
import { SETTINGS_TABS } from "../constants/settingsTabs";

const TAB_ICONS = {
  profile: User,
  system: Settings,
  notifications: Bell,
  "audit-log": ClipboardList,
};

function SettingsTabNav({ activeTab, onTabChange }) {
  return (
    <div className="overflow-x-auto">
      <div
        className="inline-flex min-w-full gap-1 rounded-xl border p-1 sm:min-w-0"
        style={{ borderColor: "var(--admin-header-surface-border)" }}
        role="tablist"
        aria-label="Settings sections"
      >
        {SETTINGS_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex min-w-fit flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-[var(--admin-primary-color)] text-white shadow-sm"
                  : "admin-text-muted hover:bg-[var(--admin-permissions-row-hover)] hover:text-[var(--admin-foreground)]"
              }`}
            >
              {Icon ? <Icon size={16} /> : null}
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SettingsTabNav;
