/**
 * Shared table body states for listings: error (with retry) and empty.
 * Loading is handled by TableLoadingSkeleton in the parent.
 */
function ListingErrorRow({ colSpan, message, onRetry }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="admin-text-muted px-4 py-16 text-center text-sm"
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <p className="admin-text text-sm font-medium">{message}</p>
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
      </td>
    </tr>
  );
}

function ListingEmptyRow({ colSpan, message }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="admin-text-muted px-4 py-16 text-center text-sm"
      >
        {message}
      </td>
    </tr>
  );
}

export { ListingEmptyRow, ListingErrorRow };
