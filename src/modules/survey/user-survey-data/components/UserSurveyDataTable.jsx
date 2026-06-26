import { Eye, Pencil } from "lucide-react";
import TableCard from "../../../../components/admin/TableCard";
import TableLoadingSkeleton from "../../../../components/admin/TableLoadingSkeleton";
import { ADMIN_TABLE_INNER_CLASS } from "../../../shared/utils/tableHelpers";
import { formatStatusLabel } from "../../../shared/utils/statusLabels";
import { EMPTY_TABLE_MESSAGE } from "../utils/constants";

const COLUMNS = [
  "User ID",
  "User Name",
  "Start Time",
  "End Time",
  "Points",
  "Status",
  "Action",
];

const TABLE_HEAD =
  "admin-text-muted text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

const iconBtnClass = (isDarkMode, disabled) =>
  `inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
    disabled
      ? "cursor-not-allowed opacity-40"
      : isDarkMode
        ? "text-[#9fb0c8] hover:bg-[#1e2e45] hover:text-[#f8fafc]"
        : "text-[#5e718a] hover:bg-[#eef4fb] hover:text-[#203148]"
  }`;

function UserSurveyDataTable({ rows, isLoading, isDarkMode, footer }) {
  const hasData = rows.length > 0;

  return (
    <TableCard isDarkMode={isDarkMode} footer={footer}>
      <table className={ADMIN_TABLE_INNER_CLASS}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className={`${TABLE_HEAD} ${col === "Action" ? "text-right" : ""}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableLoadingSkeleton columns={COLUMNS} />
            ) : !hasData ? (
              <tr>
                <td colSpan={COLUMNS.length} className="admin-text-muted px-4 py-16 text-center text-sm">
                  {EMPTY_TABLE_MESSAGE}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const statusLabel = formatStatusLabel(row.status);
                const isActive = statusLabel === "Active";
                return (
                  <tr key={row.id} className="align-middle">
                    <td className="admin-text whitespace-nowrap">{row.id}</td>
                    <td className="admin-text whitespace-nowrap">{row.userName}</td>
                    <td className="admin-text whitespace-nowrap">{row.startTime}</td>
                    <td className="admin-text whitespace-nowrap">{row.endTime}</td>
                    <td className="admin-text whitespace-nowrap">{row.points}</td>
                    <td className="admin-text whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${
                          isActive
                            ? "bg-[var(--admin-success-text)]/15 text-[var(--admin-success-text)]"
                            : "bg-[var(--admin-warning-text)]/15 text-[var(--admin-warning-text)]"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled
                          className={iconBtnClass(isDarkMode, true)}
                          aria-label="View"
                          title="View"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          disabled
                          className={iconBtnClass(isDarkMode, true)}
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
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

export default UserSurveyDataTable;
