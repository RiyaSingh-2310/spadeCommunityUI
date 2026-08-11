import { useCallback, useEffect, useRef } from "react";
import { CheckCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toastApiError, toastApiSuccess } from "../../services/toast/apiToast";
import { useMessages } from "../../modules/notifications/context/MessagesContext";

function NotificationDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const {
    recentItems,
    unreadCount,
    isLoading,
    refreshRecent,
    markAsRead,
    markAllAsRead,
  } = useMessages();

  useEffect(() => {
    if (!isOpen) return;
    refreshRecent({ silent: true }).catch(() => {});
  }, [isOpen, refreshRecent]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (!drawerRef.current?.contains(event.target)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, handleClose]);

  const handleMarkAllAsRead = async () => {
    try {
      const data = await markAllAsRead();
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
    }
  };

  const handleViewAll = () => {
    handleClose();
    navigate("/messages");
  };

  const handleNotificationClick = (notification) => {
    const messageId = String(notification?.id ?? "").trim();
    if (!messageId || messageId === "undefined" || messageId === "null") {
      return;
    }

    handleClose();
    // No PATCH /messages/:id/read — optimistically clear unread, then open details GET.
    if (!notification?.isRead) {
      markAsRead(messageId);
    }
    navigate(`/messages/${encodeURIComponent(messageId)}`);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="admin-header-overlay fixed inset-0 z-[200] transition-opacity duration-300"
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
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="admin-icon-btn inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--admin-success-text)] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={16} strokeWidth={2.25} />
            <span>Mark All As Read</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {isLoading && recentItems.length === 0 ? (
            <p className="admin-text-muted px-2 py-8 text-center text-sm">
              Loading notifications...
            </p>
          ) : recentItems.length === 0 ? (
            <p className="admin-text-muted px-2 py-8 text-center text-sm">
              No notifications found.
            </p>
          ) : (
            recentItems.map((notification) => (
              <button
                type="button"
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`admin-header-surface mb-2 w-full rounded-xl border p-3 text-left transition hover:opacity-95 ${
                  !notification.isRead ? "admin-notification-unread" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`admin-text text-sm ${
                      !notification.isRead ? "font-bold" : "font-medium"
                    }`}
                  >
                    {notification.title || notification.subject}
                  </p>
                  {!notification.isRead && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--admin-success-text)]" />
                  )}
                </div>
                <p
                  className={`admin-text-muted mt-1 line-clamp-2 text-xs ${
                    !notification.isRead ? "font-semibold" : ""
                  }`}
                >
                  {notification.description || notification.body}
                </p>
                <p className="admin-text-subtle mt-2 text-[11px]">
                  {notification.datetime || notification.dateTime}
                </p>
              </button>
            ))
          )}
        </div>

        <div
          className="shrink-0 border-t p-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <button
            type="button"
            onClick={handleViewAll}
            className="admin-text h-11 w-full rounded-xl border text-sm font-semibold transition hover:opacity-90"
            style={{ borderColor: "var(--admin-header-surface-border)" }}
          >
            View All Notifications
          </button>
        </div>
      </aside>
    </>
  );
}

export default NotificationDrawer;
