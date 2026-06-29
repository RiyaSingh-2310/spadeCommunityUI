import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  THEME_PREFERENCE_CHANGED_EVENT,
  THEME_PREFERENCES,
  getStoredThemePreference,
  isDarkThemePreference,
  persistThemePreference,
} from "../modules/settings/utils/themePreference";

const ThemeContext = createContext(null);

function dispatchThemePreferenceChanged(themePreference) {
  window.dispatchEvent(
    new CustomEvent(THEME_PREFERENCE_CHANGED_EVENT, {
      detail: { themePreference },
    })
  );
}

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreferenceState] = useState(() => {
    const preference = getStoredThemePreference();
    persistThemePreference(preference);
    return preference;
  });

  const isDarkMode = isDarkThemePreference(themePreference);

  const setThemePreference = useCallback((preference) => {
    const normalized = persistThemePreference(preference);
    setThemePreferenceState(normalized);
    dispatchThemePreferenceChanged(normalized);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreferenceState((current) => {
      const next = isDarkThemePreference(current)
        ? THEME_PREFERENCES.LIGHT
        : THEME_PREFERENCES.DARK;
      persistThemePreference(next);
      dispatchThemePreferenceChanged(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key != null && event.key !== "settings.system") return;
      const next = getStoredThemePreference();
      setThemePreferenceState(next);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({
      isDarkMode,
      themePreference,
      setThemePreference,
      toggleTheme,
    }),
    [isDarkMode, themePreference, setThemePreference, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
