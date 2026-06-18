import { useEffect, useMemo, useState } from "react";
import TableCard from "../../../components/admin/TableCard";
import { toastApiSuccess } from "../../../services/toast/apiToast";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
} from "../utils/settingsStorage";
import PreferenceToggle from "./PreferenceToggle";

const NOTIFICATION_ITEMS = [
  {
    key: "emailNotifications",
    title: "Email Notifications",
    description: "Receive important updates and alerts by email.",
  },
  {
    key: "systemNotifications",
    title: "System Notifications",
    description: "Get notified about platform and system-level changes.",
  },
  {
    key: "projectNotifications",
    title: "Project Notifications",
    description: "Stay informed when projects are created or updated.",
  },
  {
    key: "surveyNotifications",
    title: "Survey Notifications",
    description: "Receive alerts for survey activity and status changes.",
  },
  {
    key: "securityAlerts",
    title: "Security Alerts",
    description: "Get notified about security-related account activity.",
  },
];

function NotificationsSettingsTab({ isDarkMode }) {
  const [form, setForm] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  useEffect(() => {
    const saved = getNotificationSettings();
    setForm(saved);
    setInitialSnapshot(saved);
  }, []);

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return JSON.stringify(form) !== JSON.stringify(initialSnapshot);
  }, [form, initialSnapshot]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isDirty) return;
    saveNotificationSettings(form);
    setInitialSnapshot({ ...form });
    toastApiSuccess({ message: "Notification preferences saved successfully." });
  };

  return (
    <form onSubmit={handleSubmit}>
      <TableCard title="Notification Preferences" isDarkMode={isDarkMode}>
        <div className="divide-y divide-[var(--admin-header-surface-border)]">
          {NOTIFICATION_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="admin-text text-sm font-semibold">{item.title}</p>
                <p className="admin-text-muted text-xs">{item.description}</p>
              </div>
              <PreferenceToggle
                checked={Boolean(form[item.key])}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, [item.key]: value }))
                }
                label={item.title}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!isDirty}
            className="h-11 rounded-xl bg-[var(--admin-primary-color)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Preferences
          </button>
        </div>
      </TableCard>
    </form>
  );
}

export default NotificationsSettingsTab;
