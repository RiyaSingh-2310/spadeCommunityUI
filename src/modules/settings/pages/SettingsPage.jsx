import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import {
  DEFAULT_SETTINGS_TAB,
  getLegacySettingsTabRedirect,
  getSettingsTabsForRole,
  isValidSettingsTab,
  resolveSettingsTab,
} from "../constants/settingsTabs";
import NotificationsSettingsTab from "../components/NotificationsSettingsTab";
import ProfileSettingsTab from "../components/ProfileSettingsTab";
import SettingsTabNav from "../components/SettingsTabNav";
import SystemSettingsTab from "../components/SystemSettingsTab";

function SettingsPage({ isDarkMode }) {
  const settingsTabs = getSettingsTabsForRole();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const legacyRedirect = getLegacySettingsTabRedirect(tabParam);
  const resolvedTab = resolveSettingsTab(tabParam, settingsTabs);
  const activeTab = resolvedTab ?? DEFAULT_SETTINGS_TAB;

  useEffect(() => {
    if (legacyRedirect) {
      navigate(legacyRedirect, { replace: true });
      return;
    }
    if (!tabParam || !isValidSettingsTab(tabParam, settingsTabs)) {
      setSearchParams({ tab: DEFAULT_SETTINGS_TAB }, { replace: true });
    }
  }, [legacyRedirect, navigate, settingsTabs, tabParam, setSearchParams]);

  const handleTabChange = (nextTab) => {
    setSearchParams({ tab: nextTab });
  };

  if (legacyRedirect) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        subtitle="Manage your account, preferences, and system activity."
        isDarkMode={isDarkMode}
      />

      <SettingsTabNav
        tabs={settingsTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {activeTab === "profile" && <ProfileSettingsTab isDarkMode={isDarkMode} />}
      {activeTab === "system" && <SystemSettingsTab isDarkMode={isDarkMode} />}
      {activeTab === "notifications" && (
        <NotificationsSettingsTab isDarkMode={isDarkMode} />
      )}
    </div>
  );
}

export default SettingsPage;
