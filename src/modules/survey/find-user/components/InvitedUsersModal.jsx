import { X } from "lucide-react";
import TableCard from "../../../../components/admin/TableCard";
import { getAdminCancelButtonClass } from "../../../shared/utils/formStyles";
import { INVITED_USERS_DEMO } from "../utils/demoData";

const TABLE_HEAD =
  "admin-text-muted px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

function InvitedUsersModal({ isOpen, onClose, isDarkMode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
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
          <TableCard isDarkMode={isDarkMode}>
            <div className="overflow-x-auto">
              <table className="admin-table min-w-full text-sm">
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
                  {INVITED_USERS_DEMO.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="border-t align-middle"
                      style={{ borderColor: "var(--admin-header-surface-border)" }}
                    >
                      <td className="admin-text px-3 py-3">{idx + 1}</td>
                      <td className="admin-text px-3 py-3">{row.name}</td>
                      <td className="admin-text px-3 py-3">{row.email}</td>
                      <td className="admin-text px-3 py-3">{row.inviteStatus}</td>
                      <td className="admin-text px-3 py-3">{row.earnedPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
