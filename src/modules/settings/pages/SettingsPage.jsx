import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import {
  DEFAULT_SETTINGS_TAB,
  isValidSettingsTab,
} from "../constants/settingsTabs";
import AuditLogSettingsTab from "../components/AuditLogSettingsTab";
import NotificationsSettingsTab from "../components/NotificationsSettingsTab";
import ProfileSettingsTab from "../components/ProfileSettingsTab";
import SettingsTabNav from "../components/SettingsTabNav";
import SystemSettingsTab from "../components/SystemSettingsTab";

function SettingsPage({ isDarkMode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = isValidSettingsTab(tabParam) ? tabParam : DEFAULT_SETTINGS_TAB;

  useEffect(() => {
    if (!tabParam || !isValidSettingsTab(tabParam)) {
      setSearchParams({ tab: DEFAULT_SETTINGS_TAB }, { replace: true });
    }
  }, [tabParam, setSearchParams]);

  const handleTabChange = (nextTab) => {
    setSearchParams({ tab: nextTab });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        subtitle="Manage your account, preferences, and system activity."
        isDarkMode={isDarkMode}
      />

      <SettingsTabNav activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "profile" && <ProfileSettingsTab isDarkMode={isDarkMode} />}
      {activeTab === "system" && <SystemSettingsTab isDarkMode={isDarkMode} />}
      {activeTab === "notifications" && (
        <NotificationsSettingsTab isDarkMode={isDarkMode} />
      )}
      {activeTab === "audit-log" && <AuditLogSettingsTab isDarkMode={isDarkMode} />}
    </div>
  );
}

export default SettingsPage;
