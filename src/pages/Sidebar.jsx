import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Handshake,
  BriefcaseBusiness,
  BadgeDollarSign,
  ClipboardList,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import heroLogo from "../assets/hero.png";
import compressedLogo from "../assets/SpadeCommunitylogocompressed.png";

export default function Sidebar({ isDarkMode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: "Dashboard", hasArrow: false },
    { icon: <Users size={18} />, label: "Users", hasArrow: false },
    { icon: <UserCog size={18} />, label: "Clients", hasArrow: false },
    { icon: <Handshake size={18} />, label: "Partners", hasArrow: false },
    {
      icon: <BriefcaseBusiness size={18} />,
      label: "Project Manager",
      hasArrow: false,
    },
    { icon: <BadgeDollarSign size={18} />, label: "Sales", hasArrow: true },
    { icon: <ClipboardList size={18} />, label: "Pre Screen", hasArrow: true },
    { icon: <ClipboardList size={18} />, label: "Survey", hasArrow: true },
    { icon: <History size={18} />, label: "Log Activity", hasArrow: false },
  ];

  return (
    <div
      className={`h-screen flex flex-col justify-between select-none border-r transition-all duration-300 ${
        isDarkMode
          ? "bg-[#111b2c] text-[#cbd5e1] border-[#2a3c56]"
          : "bg-white text-[#2a3548] border-[#dce6f1]"
      } ${
        isCollapsed ? "w-20" : "w-[270px]"
      }`}
    >
      <div>
        <div
          className={`flex items-center border-b px-4 h-[72px] shrink-0 ${
            isDarkMode ? "border-[#2a3c56]" : "border-[#dce6f1]"
          }`}
        >
          <div
            className={`flex w-full items-center transition-all duration-300 ${
              isCollapsed ? "justify-center" : "justify-start gap-3"
            }`}
          >
            <img
              src={heroLogo}
              alt="Spade logo"
              className={`shrink-0 object-contain transition-all duration-300 ${
                isCollapsed
                  ? "pointer-events-none absolute opacity-0 scale-95 h-0 w-0"
                  : "opacity-100 scale-100 h-10 w-10"
              }`}
            />

            {!isCollapsed && (
              <div className="flex flex-col justify-center leading-none transition-opacity duration-200">
                <h1 className="text-base font-bold tracking-wider text-[#138842]">
                  SPADE
                </h1>
                <p
                  className={`mt-0.5 text-[9px] font-semibold tracking-[0.24em] ${
                    isDarkMode ? "text-[#94a3b8]" : "text-[#3f4a5b]"
                  }`}
                >
                  COMMUNITY
                </p>
              </div>
            )}

            <img
              src={compressedLogo}
              alt="Spade compact logo"
              className={`shrink-0 object-contain transition-all duration-300 ${
                isCollapsed
                  ? "opacity-100 scale-100 h-9 w-9 sm:h-10 sm:w-10"
                  : "pointer-events-none absolute opacity-0 scale-95 h-0 w-0"
              }`}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5 px-3">
          {menuItems.map((item, index) => {
            const isActive = item.label === "Dashboard";

            return (
              <div
                key={index}
                className={`flex items-center justify-between rounded-2xl px-3.5 py-3 cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-[#e6f6ee] text-[#138842] font-semibold shadow-[inset_0_0_0_1px_rgba(19,136,66,0.12)]"
                    : isDarkMode
                      ? "text-[#94a3b8] hover:bg-[#1f3047] hover:text-[#f8fafc]"
                      : "text-[#677388] hover:bg-[#f2f7fc] hover:text-[#273448]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      isActive
                        ? "text-[#138842]"
                        : isDarkMode
                          ? "text-[#64748b]"
                          : "text-[#8b96a7]"
                    }
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </div>

                {item.hasArrow && !isCollapsed && (
                  <ChevronRight
                    size={14}
                    className={isDarkMode ? "text-[#64748b]" : "text-[#9aa4b3]"}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`w-full h-14 border-t p-4 flex items-center gap-3 text-sm font-medium transition-all duration-200 ${
          isDarkMode
            ? "border-[#2a3c56] hover:bg-[#1f3047] text-[#94a3b8] hover:text-[#f8fafc]"
            : "border-[#dce6f1] hover:bg-[#f2f7fc] text-[#7a879a] hover:text-[#253247]"
        }`}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        {!isCollapsed && <span>Collapse</span>}
      </button>
    </div>
  );
}