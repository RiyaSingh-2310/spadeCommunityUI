import { useState } from "react";
import {
  Home,
  User,
  Shield,
  Star,
  Cloud,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: <Home size={18} />, label: "Dashboard", hasArrow: false },
    { icon: <User size={18} />, label: "Admin Users", hasArrow: false },
    { icon: <Shield size={18} />, label: "Clients", hasArrow: false },
    { icon: <Star size={18} />, label: "Partners", hasArrow: false },
    { icon: <Cloud size={18} />, label: "Project Manager", hasArrow: false },
    { icon: <Shield size={18} />, label: "Sales", hasArrow: true },
    { icon: <Shield size={18} />, label: "Pre Screen", hasArrow: true },
    { icon: <FileText size={18} />, label: "Survey", hasArrow: true },
    { icon: <FileText size={18} />, label: "Invoice", hasArrow: true },
    { icon: <Clock size={18} />, label: "Log Activity", hasArrow: false },
  ];

  return (
    <div 
      className={`h-screen bg-[#1f2430] text-white flex flex-col justify-between select-none border-r border-gray-700/50 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Logo Section - Height exact h-16 hai border alignment ke liye */}
        <div className="flex items-center gap-3 px-5 border-b border-gray-700/50 h-16 shrink-0">
          <img
            src="https://i.imgur.com/your-logo.png" 
            alt="logo"
            className="w-8 h-8 rounded-full shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col justify-center leading-none">
              <h1 className="text-base font-bold tracking-wider text-white">SPADE</h1>
              <p className="text-[10px] text-gray-400 tracking-widest font-medium mt-0.5">COMMUNITY</p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="mt-4 flex flex-col gap-0.5 px-2">
          {menuItems.map((item, index) => {
            const isActive = item.label === "Admin Users"; 
            
            return (
              <div
                key={index}
                className={`flex items-center justify-between px-4 py-3 rounded-md cursor-pointer transition-all duration-150 ${
                  isActive 
                    ? "bg-[#2a3142] text-white font-medium" 
                    : "text-gray-300 hover:bg-[#2a3142]/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-blue-400" : "text-gray-400"}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </div>
                
                {item.hasArrow && !isCollapsed && (
                  <ChevronRight size={14} className="text-gray-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="border-t border-gray-700/50 p-4 flex items-center gap-3 hover:bg-[#2a3142]/50 text-gray-400 hover:text-white text-sm font-medium transition-all duration-150 w-full h-14"
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        {!isCollapsed && <span>Collapse</span>}
      </button>
    </div>
  );
}