import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileAvatar from "../shared/ProfileAvatar";
import { clearAuthSession, getAdminUser } from "../../services/auth/authStorage";
import HeaderSearch from "./HeaderSearch";
import NotificationDrawer from "./NotificationDrawer";

function AdminNavbar({ isDarkMode, onToggleTheme }) {
  const navigate = useNavigate();
  const admin = getAdminUser();
  const adminName = admin?.displayName || "Admin";
  const adminEmail = admin?.email || "";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const iconButtonClass =
    "admin-icon-btn admin-text-subtle rounded-xl p-2.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-header-search-border)]";

  const avatarProps = {
    imageUrl: admin?.imageUrl,
    firstName: admin?.firstName,
    lastName: admin?.lastName,
    alt: adminName,
  };

  return (
    <>
      <div
        className={`admin-header-surface relative flex h-[72px] w-full items-center justify-end border-b px-4 transition-colors duration-300 sm:px-6`}
      >
        <div className="flex w-full items-center justify-end gap-2.5 sm:gap-3">
          <HeaderSearch />

          <button
            type="button"
            onClick={() => setIsNotificationOpen(true)}
            className={`${iconButtonClass} relative`}
            aria-label="Open notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-2 w-2 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--admin-success-text)] opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-[var(--admin-success-text)]" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className={iconButtonClass}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="admin-header-surface flex items-center gap-2 rounded-full border px-2.5 py-1.5 transition-all duration-200 focus:outline-none"
            >
              <ProfileAvatar {...avatarProps} size="sm" />
              <span className="admin-text max-w-[120px] truncate text-sm font-medium">
                {adminName}
              </span>
              <ChevronDown size={14} className="admin-text-subtle" />
            </button>

            {isDropdownOpen && (
              <div className="admin-header-surface absolute right-0 z-50 mt-3 w-64 rounded-2xl border text-sm shadow-xl">
                <div
                  className="flex items-center gap-3 border-b px-4 py-3"
                  style={{ borderColor: "var(--admin-header-surface-border)" }}
                >
                  <ProfileAvatar {...avatarProps} size="md" />
                  <div className="min-w-0">
                    <h4 className="admin-text truncate font-semibold">{adminName}</h4>
                    <p className="admin-text-muted truncate text-xs">{adminEmail}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 p-2">
                  <button
                    type="button"
                    className="admin-icon-btn admin-text-muted flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition"
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn admin-text-muted flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <div
                    className="border-t"
                    style={{ borderColor: "var(--admin-header-surface-border)" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      clearAuthSession();
                      navigate("/auth");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-medium text-[var(--admin-danger-text)] transition hover:opacity-90"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
}

export default AdminNavbar;
