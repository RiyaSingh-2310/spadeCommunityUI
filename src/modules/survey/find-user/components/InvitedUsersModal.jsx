import { useMemo, useState } from "react";
import { X } from "lucide-react";
import AdminPagination from "../../../../components/admin/AdminPagination";
import TableCard from "../../../../components/admin/TableCard";
import { getAdminCancelButtonClass } from "../../../shared/utils/formStyles";
import { ADMIN_TABLE_INNER_CLASS } from "../../../shared/utils/tableHelpers";
import { DEFAULT_PAGE_SIZE, paginateItems } from "../../../shared/utils/pagination";
import { INVITED_USERS_DEMO } from "../utils/demoData";

const TABLE_HEAD =
  "admin-text-muted text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

function InvitedUsersModal({ isOpen, onClose, isDarkMode }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const pagination = useMemo(
    () => paginateItems(INVITED_USERS_DEMO, currentPage, pageSize),
    [currentPage, pageSize]
  );

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
        className="admin-header-surface relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
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
              <AdminPagination
                isDarkMode={isDarkMode}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
              />
            }
          >
            <table className={ADMIN_TABLE_INNER_CLASS}>
              <thead>
                <tr>
                  {["S.No", "Name", "Email", "Invite Status", "Earned Points"].map(
                    (col) => (
                      <th key={col} className={TABLE_HEAD}>
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((row, idx) => {
                  const globalIdx = (pagination.currentPage - 1) * pageSize + idx;
                  return (
                    <tr key={row.id} className="align-middle">
                      <td className="admin-text">{globalIdx + 1}</td>
                      <td className="admin-text">{row.name}</td>
                      <td className="admin-text">{row.email}</td>
                      <td className="admin-text">{row.inviteStatus}</td>
                      <td className="admin-text">{row.earnedPoints}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableCard>
        </div>

        <div
          className="shrink-0 border-t px-5 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <button type="button" onClick={onClose} className={getAdminCancelButtonClass("modal")}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvitedUsersModal;
