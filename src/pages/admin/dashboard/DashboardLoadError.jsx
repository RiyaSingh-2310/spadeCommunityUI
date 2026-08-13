/**
 * Dashboard load-failure state with Retry — matches existing admin button styles.
 */
function DashboardLoadError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-(--admin-header-surface-border) bg-(--admin-header-search-bg) px-6 py-16 text-center">
      <p className="admin-text text-sm font-medium">
        {message || "Unable to load dashboard data."}
      </p>
      {typeof onRetry === "function" ? (
        <button
          type="button"
          onClick={onRetry}
          className="admin-btn-primary h-10 rounded-xl px-4 text-sm font-semibold"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export default DashboardLoadError;
