import { Loader2 } from "lucide-react";
import TableCard from "../../../../components/admin/TableCard";
import { formatStatusLabel } from "../../../shared/utils/statusLabels";

const COLUMNS = [
  "S.No",
  "",
  "Name",
  "Email Address",
  "Mobile Number",
  "Pre-Screen Completed",
  "Joining Date",
  "Invite Status",
  "Earned Points",
  "Message",
  "Status",
];

const TABLE_HEAD =
  "admin-text-muted px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

function FindUserTable({
  users,
  selectedIds,
  onToggleRow,
  onToggleAll,
  selectAll,
  isLoading,
  isLoadingMore,
  hasSearched,
  hasMore,
  sentinelRef,
  isDarkMode,
}) {
  const allSelected =
    users.length > 0 && users.every((u) => selectedIds.has(u.id));
  const someSelected = users.some((u) => selectedIds.has(u.id));

  return (
    <TableCard isDarkMode={isDarkMode}>
      <div className="overflow-x-auto">
        <table className="admin-table min-w-full text-sm">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col || "checkbox"} className={TABLE_HEAD}>
                  {col === "" ? (
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={(e) => onToggleAll(e.target.checked)}
                      disabled={users.length === 0 || isLoading}
                      aria-label="Select all rows"
                    />
                  ) : (
                    col
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && users.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                  <Loader2
                    size={28}
                    className="mx-auto animate-spin text-[var(--admin-success-text)]"
                  />
                  <p className="admin-text-muted mt-3 text-sm">Loading users...</p>
                </td>
              </tr>
            ) : !hasSearched ? (
              <tr>
                <td colSpan={COLUMNS.length} className="admin-text-muted px-4 py-16 text-center text-sm">
                  Apply filters and click Search to find users.
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="admin-text-muted px-4 py-16 text-center text-sm">
                  No users match the selected filters.
                </td>
              </tr>
            ) : (
              users.map((user, idx) => (
                <tr
                  key={user.id}
                  className="border-t align-middle"
                  style={{ borderColor: "var(--admin-header-surface-border)" }}
                >
                  <td className="admin-text px-3 py-3 whitespace-nowrap">{idx + 1}</td>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => onToggleRow(user.id)}
                      aria-label={`Select ${user.name}`}
                    />
                  </td>
                  <td className="admin-text px-3 py-3 whitespace-nowrap">{user.name}</td>
                  <td className="admin-text px-3 py-3 whitespace-nowrap">{user.email}</td>
                  <td className="admin-text px-3 py-3 whitespace-nowrap">{user.mobile}</td>
                  <td className="admin-text px-3 py-3 whitespace-nowrap">
                    {user.preScreenCompleted}
                  </td>
                  <td className="admin-text px-3 py-3 whitespace-nowrap">{user.joiningDate}</td>
                  <td className="admin-text px-3 py-3 whitespace-nowrap">{user.inviteStatus}</td>
                  <td className="admin-text px-3 py-3 whitespace-nowrap">{user.earnedPoints}</td>
                  <td className="admin-text-muted max-w-[160px] truncate px-3 py-3" title={user.message}>
                    {user.message || "—"}
                  </td>
                  <td className="admin-text px-3 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${
                        formatStatusLabel(user.status) === "Active"
                          ? "bg-[var(--admin-success-text)]/15 text-[var(--admin-success-text)]"
                          : "bg-[var(--admin-warning-text)]/15 text-[var(--admin-warning-text)]"
                      }`}
                    >
                      {formatStatusLabel(user.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasSearched && users.length > 0 && (
        <div
          ref={sentinelRef}
          className="flex min-h-[56px] items-center justify-center py-4"
          aria-hidden={!hasMore && !isLoadingMore}
        >
          {isLoadingMore && (
            <div className="flex items-center gap-2">
              <Loader2 size={20} className="animate-spin text-[var(--admin-success-text)]" />
              <span className="admin-text-muted text-sm">Loading more...</span>
            </div>
          )}
          {!hasMore && !isLoadingMore && (
            <span className="admin-text-subtle text-xs">All records loaded</span>
          )}
        </div>
      )}
    </TableCard>
  );
}

export default FindUserTable;
