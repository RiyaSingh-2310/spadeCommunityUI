import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import AdminPagination from "../../../components/admin/AdminPagination";
import TableLoadingSkeleton from "../../../components/admin/TableLoadingSkeleton";
import { toastApiError } from "../../../services/toast/apiToast";
import {
  getSalesLogs,
  resolveSalesProjectLogId,
} from "../../../services/sales/salesProjectsApi";
import { DEFAULT_PAGE_SIZE, paginateItems } from "../../shared/utils/pagination";
import {
  ADMIN_TABLE_INNER_CLASS,
  ADMIN_TABLE_INNER_SHELL_CLASS,
} from "../../shared/utils/tableHelpers";

function RfqSalesLogListModal({ isOpen, onClose, row, isDarkMode, refreshKey = 0 }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const projectId = resolveSalesProjectLogId(row);

  const fetchLogs = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await getSalesLogs(projectId);
      setLogs(data.items);
    } catch (error) {
      toastApiError(error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) {
      setLogs([]);
      setCurrentPage(1);
      return;
    }
    fetchLogs();
  }, [isOpen, fetchLogs, refreshKey]);

  const pagination = useMemo(
    () => paginateItems(logs, currentPage, pageSize),
    [logs, currentPage, pageSize]
  );

  if (!isOpen || !projectId) return null;

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close sales log list"
        onClick={onClose}
      />
      <div
        className="admin-header-surface relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rfq-sales-log-list-title"
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <h2 id="rfq-sales-log-list-title" className="admin-text text-lg font-bold">
            Sales Log List
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className={ADMIN_TABLE_INNER_SHELL_CLASS}>
            <table className={ADMIN_TABLE_INNER_CLASS}>
              <thead>
                <tr className="admin-text-muted">
                  {["S. No.", "Email Subject", "Comment", "Comment By", "Created By", "Created Date"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="text-left text-xs font-semibold tracking-[0.02em] whitespace-nowrap"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableLoadingSkeleton
                    columns={[
                      "S. No.",
                      "Email Subject",
                      "Comment",
                      "Comment By",
                      "Created By",
                      "Created Date",
                    ]}
                  />
                ) : pagination.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-text-muted py-16 text-center text-sm">
                      No Data Available
                    </td>
                  </tr>
                ) : (
                  pagination.items.map((log, index) => (
                    <tr key={log.id ?? `${log.createdDate}-${index}`} className="align-middle">
                      <td className="whitespace-nowrap">
                        <span className="admin-text">
                          {(pagination.currentPage - 1) * pageSize + index + 1}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="admin-text">{log.emailSubject}</span>
                      </td>
                      <td>
                        <span className="admin-text">{log.comment}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="admin-text">{log.commentBy}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="admin-text">{log.createdBy}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="admin-text">{log.createdDate}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isLoading && logs.length > 0 && (
          <div className="shrink-0 border-t px-5 py-3">
            <AdminPagination
              isDarkMode={isDarkMode}
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(nextSize) => {
                setPageSize(nextSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default RfqSalesLogListModal;
