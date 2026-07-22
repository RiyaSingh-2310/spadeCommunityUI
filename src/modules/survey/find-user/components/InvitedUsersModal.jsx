import { useEffect, useState } from "react";
import { X } from "lucide-react";
import AdminPagination from "../../../../components/admin/AdminPagination";
import TableCard from "../../../../components/admin/TableCard";
import TableLoadingSkeleton from "../../../../components/admin/TableLoadingSkeleton";
import { getAdminCancelButtonClass } from "../../../shared/utils/formStyles";
import { ADMIN_TABLE_INNER_CLASS } from "../../../shared/utils/tableHelpers";
import { DEFAULT_PAGE_SIZE } from "../../../shared/utils/pagination";
import { formatStatusLabel } from "../../../shared/utils/statusLabels";
import { toastApiError } from "../../../../services/toast/apiToast";
import { getInvitedFindUsers } from "../services/findUserApi";

const TABLE_HEAD =
  "admin-text-muted text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

const COLUMNS = [
  "S.No",
  "Name",
  "Email",
  "Invite Status",
  "Earned Points",
  "Status",
];

function InvitedUsersModal({ isOpen, onClose, isDarkMode, surveyId }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [users, setUsers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(1);
      setUsers([]);
      setTotalItems(0);
      setTotalPages(0);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !surveyId) return undefined;

    let cancelled = false;

    async function loadInvitedUsers() {
      setIsLoading(true);
      try {
        const result = await getInvitedFindUsers({
          surveyId,
          page: currentPage,
          pageSize,
        });
        if (cancelled) return;
        setUsers(result.items ?? []);
        setTotalItems(result.total ?? 0);
        setTotalPages(result.totalPages ?? 0);
      } catch (err) {
        if (cancelled) return;
        setUsers([]);
        setTotalItems(0);
        setTotalPages(0);
        toastApiError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadInvitedUsers();
    return () => {
      cancelled = true;
    };
  }, [isOpen, surveyId, currentPage, pageSize]);

  const handlePageSizeChange = (nextSize) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close invited users"
        onClick={onClose}
      />
      <div
        className="admin-header-surface relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invited-users-title"
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <h2 id="invited-users-title" className="admin-text text-lg font-bold">
            Invited Users
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="admin-icon-btn admin-text-subtle flex h-8 w-8 items-center justify-center rounded-lg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TableCard
            isDarkMode={isDarkMode}
            footer={
              totalItems > 0 ? (
                <AdminPagination
                  isDarkMode={isDarkMode}
                  currentPage={currentPage}
                  totalPages={Math.max(1, totalPages)}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              ) : null
            }
          >
            <table className={ADMIN_TABLE_INNER_CLASS}>
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col} className={TABLE_HEAD}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableLoadingSkeleton columns={COLUMNS} />
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={COLUMNS.length}
                      className="admin-text-muted px-4 py-16 text-center text-sm"
                    >
                      No invited users found.
                    </td>
                  </tr>
                ) : (
                  users.map((row, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx;
                    return (
                      <tr key={row.id} className="align-middle">
                        <td className="admin-text whitespace-nowrap">
                          {globalIdx + 1}
                        </td>
                        <td className="admin-text whitespace-nowrap">{row.name}</td>
                        <td className="admin-text whitespace-nowrap">{row.email}</td>
                        <td className="admin-text whitespace-nowrap">
                          {row.inviteStatus}
                        </td>
                        <td className="admin-text whitespace-nowrap">
                          {row.earnedPoints}
                        </td>
                        <td className="admin-text whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${
                              formatStatusLabel(row.status) === "Active"
                                ? "bg-[var(--admin-success-text)]/15 text-[var(--admin-success-text)]"
                                : "bg-[var(--admin-warning-text)]/15 text-[var(--admin-warning-text)]"
                            }`}
                          >
                            {formatStatusLabel(row.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableCard>
        </div>

        <div
          className="shrink-0 border-t px-5 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className={getAdminCancelButtonClass("modal")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvitedUsersModal;
