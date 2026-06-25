function NotificationDetailModal({ notification, onClose, onMarkAsRead }) {
  if (!notification) return null;

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
  };

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close notification details"
        onClick={onClose}
      />
      <div
        className="admin-header-surface relative z-10 w-full max-w-md rounded-2xl border p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-modal-title"
      >
        <p className="admin-text-subtle mb-1 text-xs font-semibold uppercase tracking-wide">
          Notification Details
        </p>
        <h2 id="notification-modal-title" className="admin-text mb-2 text-lg font-bold">
          {notification.title}
        </h2>
        <p className="admin-text-muted mb-4 text-sm leading-relaxed">
          {notification.description}
        </p>
        <p className="admin-text-subtle mb-5 text-xs">{notification.datetime}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!notification.read && (
            <button
              type="button"
              onClick={handleMarkAsRead}
              className="h-10 rounded-xl bg-[var(--admin-success-text)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Mark As Read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="admin-header-surface admin-text h-10 rounded-xl border px-4 text-sm font-semibold transition hover:opacity-90"
            style={{ borderColor: "var(--admin-header-surface-border)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationDetailModal;
