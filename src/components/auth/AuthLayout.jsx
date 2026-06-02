import { Moon, Sun } from "lucide-react";
import AuthLogo from "./AuthLogo";

function AuthLayout({ isDarkMode, onToggleTheme, children }) {
  return (
    <div
      className={`auth-shell min-h-screen px-4 py-8 transition-colors duration-300 sm:py-10 ${
        isDarkMode ? "bg-[#111827]" : "bg-[#edf2f8]"
      }`}
      data-theme={isDarkMode ? "dark" : "light"}
    >
      <button
        type="button"
        onClick={onToggleTheme}
        className={`absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-all duration-300 hover:scale-[1.03] ${
          isDarkMode
            ? "border-[#374151] bg-[#1f2937] text-[#cbd5e1] hover:bg-[#263244]"
            : "border-[#d6dfeb] bg-white text-[#6b778b] hover:bg-[#f8fafc]"
        }`}
        aria-label="toggle theme"
      >
        {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center">
        <AuthLogo />
        <div
          className={`w-full rounded-3xl border px-5 pb-6 pt-7 transition-all duration-300 sm:px-7 ${
            isDarkMode
              ? "border-[#313f57] bg-[#1a2435] shadow-[0_18px_45px_rgba(2,6,23,0.42)]"
              : "border-[#dde6f2] bg-white shadow-[0_16px_42px_rgba(20,33,61,0.14)]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
