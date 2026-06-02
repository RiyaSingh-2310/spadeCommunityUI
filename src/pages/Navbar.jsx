import { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import heroLogo from "../assets/hero.png";

export default function Navbar({ isDarkMode, onToggleTheme }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div
      className={`relative flex h-[72px] w-full items-center justify-between border-b px-4 transition-colors duration-300 sm:px-6 ${
        isDarkMode
          ? "border-[#28384f] bg-[#131d2d]"
          : "border-[#dde7f2] bg-white/95 backdrop-blur"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={heroLogo}
          alt="Spade Community logo"
          className="h-8 w-auto max-w-[150px] object-contain sm:h-9 sm:max-w-[170px] md:h-10 md:max-w-[190px]"
        />
        <div className="leading-tight">
          <p
            className={`text-[14px] font-semibold tracking-wide ${
              isDarkMode ? "text-[#e2e8f0]" : "text-[#2f3b4d]"
            }`}
          >
            Spade Community
          </p>
          <p className={`${isDarkMode ? "text-[#7f94af]" : "text-[#7b8da5]"} text-xs`}>
            Home
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          className={`rounded-xl p-2.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 ${
            isDarkMode
              ? "text-[#94a3b8] hover:bg-[#1b2a40] hover:text-[#e2e8f0] focus-visible:ring-[#4a6c92]/40"
              : "text-[#6f8198] hover:bg-[#eef4fb] hover:text-[#223046] focus-visible:ring-[#b9cadf]/60"
          }`}
          aria-label="search"
        >
          <Search size={18} />
        </button>
        <button
          className={`relative rounded-xl p-2.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 ${
            isDarkMode
              ? "text-[#94a3b8] hover:bg-[#1b2a40] hover:text-[#e2e8f0] focus-visible:ring-[#4a6c92]/40"
              : "text-[#6f8198] hover:bg-[#eef4fb] hover:text-[#223046] focus-visible:ring-[#b9cadf]/60"
          }`}
          aria-label="notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#0ea246]"></span>
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className={`rounded-xl p-2.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 ${
            isDarkMode
              ? "text-[#cbd5e1] hover:bg-[#1b2a40] hover:text-[#f8fafc] focus-visible:ring-[#4a6c92]/40"
              : "text-[#6f8198] hover:bg-[#eef4fb] hover:text-[#223046] focus-visible:ring-[#b9cadf]/60"
          }`}
          aria-label="toggle theme"
        >
          {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 transition-all duration-200 focus:outline-none ${
              isDarkMode
                ? "border-[#344662] bg-[#0f1a2b] hover:bg-[#1a2a40]"
                : "border-[#dfe8f2] bg-white hover:bg-[#f8fbff]"
            }`}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0ea246] text-xs font-bold text-white">
              A
            </div>
            <span
              className={`text-sm font-medium ${
                isDarkMode ? "text-[#e2e8f0]" : "text-[#2d394b]"
              }`}
            >
              Admin
            </span>
            <ChevronDown
              size={14}
              className={isDarkMode ? "text-[#94a3b8]" : "text-[#8a97aa]"}
            />
          </button>

          {isDropdownOpen && (
            <div
              className={`absolute right-0 z-50 mt-3 w-64 rounded-2xl border py-3 text-sm shadow-xl ${
                isDarkMode
                  ? "border-[#32445f] bg-[#121d2f]"
                  : "border-[#dce6f2] bg-white"
              }`}
            >
              <div
                className={`flex items-center gap-3 border-b px-4 py-3 ${
                  isDarkMode ? "border-[#1e293b]" : "border-[#eef2f6]"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0ea246] text-base font-bold text-white">
                  A
                </div>
                <div>
                  <h4
                    className={`font-semibold ${
                      isDarkMode ? "text-[#f8fafc]" : "text-[#202c3d]"
                    }`}
                  >
                    Super Admin
                  </h4>
                  <p className={`text-xs ${isDarkMode ? "text-[#94a3b8]" : "text-[#8f99a8]"}`}>
                    admin@spadecommunity.com
                  </p>
                </div>
              </div>

              <div className="p-2 flex flex-col gap-1">
                <button
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                    isDarkMode
                      ? "text-[#cbd5e1] hover:bg-[#1e293b]"
                      : "text-[#5d697d] hover:bg-[#f1f5f9]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User size={16} className={isDarkMode ? "text-[#94a3b8]" : "text-[#8e99ab]"} />
                    <span>Profile</span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      isDarkMode
                        ? "bg-[#1e293b] text-[#94a3b8]"
                        : "bg-[#eef2f6] text-[#7a8699]"
                    }`}
                  >
                    User
                  </span>
                </button>

                <button
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                    isDarkMode
                      ? "text-[#cbd5e1] hover:bg-[#1e293b]"
                      : "text-[#5d697d] hover:bg-[#f1f5f9]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings
                      size={16}
                      className={isDarkMode ? "text-[#94a3b8]" : "text-[#8e99ab]"}
                    />
                    <span>Settings</span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      isDarkMode
                        ? "bg-[#1e293b] text-[#94a3b8]"
                        : "bg-[#eef2f6] text-[#7a8699]"
                    }`}
                  >
                    System
                  </span>
                </button>

                <div className={`my-1 border-t ${isDarkMode ? "border-[#1e293b]" : "border-[#eef2f6]"}`}></div>

                <button
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-medium transition ${
                    isDarkMode
                      ? "text-[#f18484] hover:bg-[#301f2d]"
                      : "text-[#de3d3d] hover:bg-[#fff1f1]"
                  }`}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}