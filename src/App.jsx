import { useEffect } from "react";
import { consumeSessionExpiredToast } from "./services/auth/sessionExpiry";
import { isAuthenticated, AUTH_SESSION_CHANGED_EVENT } from "./services/auth/authStorage";
import { fetchSystemSettings } from "./modules/settings/services/systemSettingsApi";
import ToastContainer from "./components/shared/ToastContainer";
import AppRoutes from "./Routes/AppRoutes";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function AppContent() {
  const { isDarkMode, toggleTheme, setThemePreference } = useTheme();

  useEffect(() => {
    consumeSessionExpiredToast();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncSystemSettings = async () => {
      if (!isAuthenticated()) return;

      try {
        const settings = await fetchSystemSettings();
        if (!cancelled) {
          setThemePreference(settings.themePreference);
        }
      } catch {
        // Keep stored preference when settings cannot be loaded.
      }
    };

    syncSystemSettings();

    const handleSessionChange = () => {
      syncSystemSettings();
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);
    };
  }, [setThemePreference]);

  return (
    <>
      <ToastContainer isDarkMode={isDarkMode} />
      <AppRoutes isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
