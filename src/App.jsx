import { useEffect, useState } from "react";
import { consumeSessionExpiredToast } from "./services/auth/sessionExpiry";
import ToastContainer from "./components/shared/ToastContainer";
import AppRoutes from "./Routes/AppRoutes";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    consumeSessionExpiredToast();
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <>
      <ToastContainer isDarkMode={isDarkMode} />
      <AppRoutes isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
    </>
  );
}

export default App;
