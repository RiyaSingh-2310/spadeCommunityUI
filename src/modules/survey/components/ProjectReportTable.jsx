import TableCard from "../../../components/admin/TableCard";
import TableLoadingSkeleton from "../../../components/admin/TableLoadingSkeleton";
import TableEllipsisText from "../../../components/admin/TableEllipsisText";
import {
  ADMIN_TABLE_INNER_CLASS,
  getEllipsisCellClassName,
  getEllipsisCellStyle,
  TABLE_ELLIPSIS_PX,
} from "../../shared/utils/tableHelpers";
import { getProjectReportColumns } from "../utils/projectReportColumns";
import { PROJECT_REPORT_TYPES } from "../utils/projectReportNavigation";
import { isReportTestModeValue } from "./ReportModeFilters";

const TABLE_HEAD =
  "admin-text-muted text-left text-xs font-semibold tracking-[0.02em] whitespace-nowrap";

function ReportModeBadge({ value }) {
  const isTest = isReportTestModeValue(value);
  const toneClass = isTest
    ? "bg-[var(--admin-warning-text)]/15 text-[var(--admin-warning-text)]"
    : "bg-[var(--admin-success-text)]/15 text-[var(--admin-success-text)]";

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${toneClass}`}
    >
      {isTest ? "Test" : "Live"}
    </span>
  );
}

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
                  {columns.map((column) => {
                    const isLongText =
                      column.key === "uid" ||
                      column.key === "question" ||
                      column.key === "blockReason" ||
                      column.key === "multilinkUrl" ||
                      column.key === "multiLinkUrl";
                    const ellipsisMax = isLongText ? TABLE_ELLIPSIS_PX.title : null;
                    return (
                      <td
                        key={column.key}
                        className={getEllipsisCellClassName(
                          ellipsisMax,
                          `admin-text text-sm ${ellipsisMax ? "" : "whitespace-nowrap"}`
                        )}
                        style={getEllipsisCellStyle(ellipsisMax)}
                      >
                        {column.key === "isTestLink" ? (
                          <ReportModeBadge value={row[column.key]} />
                        ) : ellipsisMax ? (
                          <TableEllipsisText>{row[column.key] ?? "—"}</TableEllipsisText>
                        ) : (
                          row[column.key] ?? "—"
                        )}
                      </td>
                    );
                  })}
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
