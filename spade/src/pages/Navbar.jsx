import { useState } from "react";
import { Search, Sun, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="w-full h-16 bg-[#111625] border-b border-[#1e2640] flex items-center justify-between px-6 text-white relative">
     
      <div className="flex items-center gap-2">
        <div className="bg-[#10b981] p-1 rounded-md text-xs font-bold">spade</div>
        <div className="font-semibold text-sm tracking-wider text-gray-300">
        
        </div>
      </div>


      <div className="flex items-center gap-6">
       
        <button className="text-gray-400 hover:text-white transition">
          <Search size={18} />
        </button>
        <button className="text-gray-400 hover:text-white transition">
          <Sun size={18} />
        </button>
        <button className="text-gray-400 hover:text-white transition relative">
          <Bell size={18} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

       
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 focus:outline-none bg-[#1a2236] px-3 py-1.5 rounded-full hover:bg-[#222c45] transition"
          >
            <div className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <span className="text-sm font-medium text-gray-200">Admin</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-[#111625] border border-[#1e2640] rounded-xl shadow-2xl z-50 py-3 text-sm">
           
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2640]">
                <div className="w-10 h-10 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-base">
                  A
                </div>
                <div>
                  <h4 className="font-semibold text-white">Super Admin</h4>
                  <p className="text-xs text-gray-500">+91 99999 99999</p>
                </div>
              </div>

              {/* Dropdown Options */}
              <div className="p-2 flex flex-col gap-1">
                <button className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-[#1a2236] transition">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400" />
                    <span>Profile</span>
                  </div>
                  <span className="text-xs bg-[#1a2236] text-gray-400 px-2 py-0.5 rounded">Settings</span>
                </button>

                <button className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-[#1a2236] transition">
                  <div className="flex items-center gap-3">
                    <Settings size={16} className="text-gray-400" />
                    <span>Settings</span>
                  </div>
                  <span className="text-xs bg-[#1a2236] text-gray-400 px-2 py-0.5 rounded">System</span>
                </button>

                <div className="border-t border-[#1e2640] my-1"></div>

                <button className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition font-medium">
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