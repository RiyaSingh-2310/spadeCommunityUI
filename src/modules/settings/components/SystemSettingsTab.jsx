import { useEffect, useMemo, useState } from "react";
import FormField from "../../../components/admin/FormField";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { toastApiSuccess } from "../../../services/toast/apiToast";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { useTheme } from "../../../context/ThemeContext";
import {
  DEFAULT_SYSTEM_SETTINGS,
  getSystemSettings,
  saveSystemSettings,
} from "../utils/settingsStorage";
import {
  THEME_PREFERENCE_OPTIONS,
  normalizeThemePreference,
} from "../utils/themePreference";
import PreferenceToggle from "./PreferenceToggle";

const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "German", "Hindi"];
const DATE_FORMAT_OPTIONS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const TIME_FORMAT_OPTIONS = ["12-hour", "24-hour"];

function SystemSettingsTab({ isDarkMode }) {
  const { themePreference, setThemePreference } = useTheme();
  const [form, setForm] = useState(DEFAULT_SYSTEM_SETTINGS);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const inputClass = getAdminInputClass();

  useEffect(() => {
    const saved = getSystemSettings();
    const normalized = {
      ...saved,
      themePreference: normalizeThemePreference(saved.themePreference),
    };
    setForm(normalized);
    setInitialSnapshot(normalized);
  }, []);

  useEffect(() => {
    setForm((prev) => ({ ...prev, themePreference }));
    setInitialSnapshot((prev) =>
      prev ? { ...prev, themePreference } : prev
    );
  }, [themePreference]);

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return JSON.stringify(form) !== JSON.stringify(initialSnapshot);
  }, [form, initialSnapshot]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleThemePreferenceChange = (value) => {
    const normalized = normalizeThemePreference(value);
    setField("themePreference", normalized);
    setThemePreference(normalized);
    setInitialSnapshot((prev) =>
      prev ? { ...prev, themePreference: normalized } : prev
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isDirty) return;
    saveSystemSettings(form);
    setInitialSnapshot({ ...form });
    toastApiSuccess({ message: "System settings saved successfully." });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TableCard title="Application Settings" isDarkMode={isDarkMode}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Application Name">
            <input
              className={inputClass}
              value={form.applicationName}
              onChange={(event) => setField("applicationName", event.target.value)}
            />
          </FormField>
          <FormField label="Default Language">
            <SearchableSelect
              inputClass={inputClass}
              value={form.defaultLanguage}
              onChange={(value) => setField("defaultLanguage", value)}
              options={LANGUAGE_OPTIONS}
              placeholder="Select language"
              searchPlaceholder="Search language..."
              aria-label="Default language"
            />
          </FormField>
          <FormField label="Date Format">
            <SearchableSelect
              inputClass={inputClass}
              value={form.dateFormat}
              onChange={(value) => setField("dateFormat", value)}
              options={DATE_FORMAT_OPTIONS}
              placeholder="Select date format"
              searchable={false}
              aria-label="Date format"
            />
          </FormField>
          <FormField label="Time Format">
            <SearchableSelect
              inputClass={inputClass}
              value={form.timeFormat}
              onChange={(value) => setField("timeFormat", value)}
              options={TIME_FORMAT_OPTIONS}
              placeholder="Select time format"
              searchable={false}
              aria-label="Time format"
            />
          </FormField>
        </div>
      </TableCard>

      <TableCard title="Theme Preferences" isDarkMode={isDarkMode}>
        <FormField label="Theme Preference" className="max-w-md">
          <SearchableSelect
            inputClass={inputClass}
            value={form.themePreference}
            onChange={handleThemePreferenceChange}
            options={THEME_PREFERENCE_OPTIONS}
            placeholder="Select theme preference"
            searchable={false}
            aria-label="Theme preference"
          />
        </FormField>
      </TableCard>

      <TableCard title="Security Preferences" isDarkMode={isDarkMode}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--admin-header-surface-border)] pb-4">
            <div>
              <p className="admin-text text-sm font-semibold">Two-Factor Authentication</p>
              <p className="admin-text-muted text-xs">
                Require an additional verification step during sign in.
              </p>
            </div>
            <PreferenceToggle
              checked={form.twoFactorAuth}
              onChange={(value) => setField("twoFactorAuth", value)}
              label="Two-factor authentication"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="admin-text text-sm font-semibold">Login Alerts</p>
              <p className="admin-text-muted text-xs">
                Receive alerts when a new login is detected.
              </p>
            </div>
            <PreferenceToggle
              checked={form.loginAlerts}
              onChange={(value) => setField("loginAlerts", value)}
              label="Login alerts"
            />
          </div>
        </div>
      </TableCard>

      <TableCard title="Session Preferences" isDarkMode={isDarkMode}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Session Timeout (minutes)">
            <input
              className={inputClass}
              type="number"
              min="5"
              value={form.sessionTimeout}
              onChange={(event) => setField("sessionTimeout", event.target.value)}
            />
          </FormField>
          <FormField label="Remember Me Duration (days)">
            <input
              className={inputClass}
              type="number"
              min="1"
              value={form.rememberMeDuration}
              onChange={(event) => setField("rememberMeDuration", event.target.value)}
            />
          </FormField>
        </div>
      </TableCard>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isDirty}
          className="h-11 rounded-xl bg-[var(--admin-primary-color)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Settings
        </button>
      </div>
    </form>
  );
}

export default SystemSettingsTab;
