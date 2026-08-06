import TableCard from "../../../components/admin/TableCard";
import TableLoadingSkeleton from "../../../components/admin/TableLoadingSkeleton";
import { ADMIN_TABLE_INNER_CLASS } from "../../shared/utils/tableHelpers";
import { getProjectReportColumns } from "../utils/projectReportColumns";
import { PROJECT_REPORT_TYPES } from "../utils/projectReportNavigation";

const TABLE_HEAD =
  "admin-text-muted text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

function ProjectReportTable({
  rows,
  isLoading,
  isDarkMode,
  footer,
  errorMessage = "",
  reportType = PROJECT_REPORT_TYPES.PROJECT,
}) {
  const columns = getProjectReportColumns(reportType);
  const hasData = rows.length > 0;

  return (
    <TableCard isDarkMode={isDarkMode} footer={footer}>
      <div className="overflow-x-auto">
        <table className={ADMIN_TABLE_INNER_CLASS}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={TABLE_HEAD}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableLoadingSkeleton columns={columns.map((column) => column.label)} />
            ) : errorMessage ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="admin-text-muted px-4 py-16 text-center text-sm"
                >
                  {errorMessage}
                </td>
              </tr>
            ) : !hasData ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="admin-text-muted px-4 py-16 text-center text-sm"
                >
                  No data available in table
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${row.id}-${index}`} className="align-middle">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`admin-text text-sm ${
                        column.key === "question" || column.key === "multilinkUrl"
                          ? "max-w-xs whitespace-normal break-words"
                          : "whitespace-nowrap"
                      }`}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </TableCard>
  );
}

export default ProjectReportTable;
