import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";

function AdminLayout({ isDarkMode, onToggleTheme }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div
      className={`h-screen overflow-hidden transition-colors duration-300 ${
        isDarkMode ? "bg-[#0f1724]" : "bg-[#edf2f8]"
      }`}
    >
      <AdminSidebar
        isDarkMode={isDarkMode}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <div
        className={`min-w-0 transition-[margin] duration-300 ${
          isSidebarCollapsed ? "ml-20" : "ml-[270px]"
        }`}
      >
        <AdminNavbar isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />
        <main className="h-[calc(100vh-72px)] overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
