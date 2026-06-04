import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCheck, X } from "lucide-react";
import NotificationDetailModal from "./NotificationDetailModal";

const BASE_NOTIFICATIONS = [
  {
    id: 1,
    title: "New RFQ Submitted",
    description: "Rohan Kumar submitted RFQ-1042 for review.",
    datetime: "Today, 10:24 AM",
    read: false,
  },
  {
    id: 2,
    title: "Partner Active",
    description: "Deepak Traders account is now active.",
    datetime: "Today, 09:10 AM",
    read: false,
  },
  {
    id: 3,
    title: "Client Profile Updated",
    description: "Alpha Corp updated billing and contact information.",
    datetime: "Yesterday, 06:45 PM",
    read: false,
  },
  {
    id: 4,
    title: "Survey Settings Changed",
    description: "Survey Settings were updated by Super Admin.",
    datetime: "Yesterday, 02:18 PM",
    read: true,
  },
];

const EXTENDED_NOTIFICATIONS = [
  {
    id: 5,
    title: "Invoice Generated",
    description: "Invoice INV-2209 was generated for Beta Labs.",
    datetime: "Mar 12, 2026, 11:30 AM",
    read: true,
  },
  {
    id: 6,
    title: "Project Manager Added",
    description: "Priya Desai was added to the project managers list.",
    datetime: "Mar 11, 2026, 04:05 PM",
    read: true,
  },
  {
    id: 7,
    title: "Prescreen Group Updated",
    description: "Prescreen Group configuration was modified.",
    datetime: "Mar 10, 2026, 09:52 AM",
    read: true,
  },
  {
    id: 8,
    title: "Sales Manager Login",
    description: "Arun Kumar signed in from a new device.",
    datetime: "Mar 09, 2026, 08:14 AM",
    read: true,
  },
];

function NotificationDrawer({ isOpen, onClose, onUnreadCountChange }) {
  const drawerRef = useRef(null);
  const [notifications, setNotifications] = useState(BASE_NOTIFICATIONS);
  const [showAll, setShowAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const visibleNotifications = notifications;

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const handleClose = useCallback(() => {
    setShowAll(false);
    setSelectedNotification(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (selectedNotification) return;
      if (!drawerRef.current?.contains(event.target)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, selectedNotification, handleClose]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    setSelectedNotification((prev) =>
      prev && prev.id === id ? { ...prev, read: true } : prev
    );
  };

  const handleMarkAsReadAndCloseModal = (id) => {
    markAsRead(id);
    setSelectedNotification(null);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setSelectedNotification((prev) => (prev ? { ...prev, read: true } : prev));
  };

  const handleViewAll = () => {
    setShowAll(true);
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const extra = EXTENDED_NOTIFICATIONS.filter((item) => !existingIds.has(item.id));
      return [...prev, ...extra];
    });
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`admin-header-overlay fixed inset-0 z-[200] transition-opacity duration-300 ${
          selectedNotification ? "pointer-events-none" : ""
        }`}
        aria-hidden
      />

      <aside
        ref={drawerRef}
        className={`admin-header-surface fixed top-0 right-0 z-[210] flex h-full w-full flex-col border-l shadow-2xl transition-transform duration-[350ms] ease-in-out sm:max-w-[320px] md:max-w-[400px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Notifications"
      >
        <div
          className="shrink-0 border-b px-4 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
        <div className="flex items-center justify-between gap-3">
          <h2 className="admin-text mb-3 text-lg font-bold">Notifications</h2>
          <button
              type="button"
              onClick={handleClose}
              className="admin-icon-btn admin-text-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
              aria-label="Close notifications drawer"
            >
              <X size={18} />
            </button>
          </div>
            <button
              type="button"
              onClick={markAllAsRead}
              className="admin-icon-btn inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--admin-success-text)] transition-colors duration-200"
            >
              <CheckCheck size={16} strokeWidth={2.25} />
              <span>Mark All As Read</span>
            </button>
            
          </div>
        

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {visibleNotifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`admin-header-surface mb-2 w-full rounded-xl border p-3 text-left transition hover:opacity-95 ${
                !notification.read ? "admin-notification-unread" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="admin-text text-sm font-semibold">{notification.title}</p>
                {!notification.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--admin-success-text)]" />
                )}
              </div>
              <p className="admin-text-muted mt-1 line-clamp-2 text-xs">{notification.description}</p>
              <p className="admin-text-subtle mt-2 text-[11px]">{notification.datetime}</p>
            </button>
          ))}
        </div>

        <div
          className="shrink-0 border-t p-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <button
            type="button"
            onClick={handleViewAll}
            disabled={showAll}
            className="admin-text h-11 w-full rounded-xl border text-sm font-semibold transition disabled:cursor-default disabled:opacity-60 enabled:hover:opacity-90"
            style={{ borderColor: "var(--admin-header-surface-border)" }}
          >
            View All Notifications
          </button>
        </div>
      </aside>

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onMarkAsRead={handleMarkAsReadAndCloseModal}
      />
    </>
  );
}

export default NotificationDrawer;
