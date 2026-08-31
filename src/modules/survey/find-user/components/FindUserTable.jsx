import AdminPagination from "../../../../components/admin/AdminPagination";
import TableCard from "../../../../components/admin/TableCard";
import TableLoadingSkeleton from "../../../../components/admin/TableLoadingSkeleton";
import { ADMIN_TABLE_INNER_CLASS } from "../../../shared/utils/tableHelpers";
import { formatStatusLabel } from "../../../shared/utils/statusLabels";
import { toUiSentenceCase } from "../../../shared/utils/uiText";

const COLUMNS = [
  "S.No",
  "",
  "Name",
  "Email",
  "Balance",
  "Invite Status",
  "Earned Points",
  "Joined Date",
  "Matched Answers",
  "Status",
];

const TABLE_HEAD =
  "admin-text-muted text-left text-xs font-semibold tracking-[0.02em] whitespace-nowrap";

function FindUserTable({
  users,
  selectedIds,
  onToggleRow,
  onToggleAll,
  selectAll,
  isLoading,
  hasSearched,
  isDarkMode,
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
}) {
  const allSelected =
    users.length > 0 &&
    users.every((u) => selectedIds.has(u.panelistId || u.id));
  const someSelected = users.some((u) =>
    selectedIds.has(u.panelistId || u.id)
  );

  const rowOffset = (currentPage - 1) * pageSize;

  const paginationFooter =
    hasSearched && totalItems > 0 ? (
      <AdminPagination
        isDarkMode={isDarkMode}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    ) : null;

  return (
    <TableCard isDarkMode={isDarkMode} footer={paginationFooter}>
      <table className={ADMIN_TABLE_INNER_CLASS}>
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
                    toUiSentenceCase(col)
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && users.length === 0 ? (
              <TableLoadingSkeleton columns={COLUMNS} />
            ) : !hasSearched ? (
              <tr>
                <td colSpan={COLUMNS.length} className="admin-text-muted px-4 py-16 text-center text-sm">
                  Apply filters and click Search to find users.
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="admin-text-muted px-4 py-16 text-center text-sm">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user, idx) => {
                const rowId = user.panelistId || user.id;
                return (
                <tr key={rowId} className="align-middle">
                  <td className="admin-text whitespace-nowrap">{rowOffset + idx + 1}</td>
                  <td>
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={selectedIds.has(rowId)}
                      onChange={() => onToggleRow(rowId)}
                      aria-label={`Select ${user.name}`}
                    />
                  </td>
                  <td className="admin-text whitespace-nowrap">{user.name}</td>
                  <td className="admin-text whitespace-nowrap">{user.email}</td>
                  <td className="admin-text whitespace-nowrap">{user.balance}</td>
                  <td className="admin-text whitespace-nowrap">{user.inviteStatus}</td>
                  <td className="admin-text whitespace-nowrap">{user.earnedPoints}</td>
                  <td className="admin-text whitespace-nowrap">{user.joiningDate}</td>
                  <td
                    className="admin-text max-w-[240px] truncate"
                    title={user.matchedAnswers}
                  >
                    {user.matchedAnswers || "—"}
                  </td>
                  <td className="admin-text whitespace-nowrap">
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
              );
              })
            )}
          </tbody>
      </table>
    </TableCard>
  );
}

export default FindUserTable;
