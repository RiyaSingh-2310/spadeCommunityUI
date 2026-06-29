import { useEffect } from "react";
import { consumeSessionExpiredToast } from "./services/auth/sessionExpiry";
import ToastContainer from "./components/shared/ToastContainer";
import AppRoutes from "./Routes/AppRoutes";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function AppContent() {
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    consumeSessionExpiredToast();
  }, []);

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
