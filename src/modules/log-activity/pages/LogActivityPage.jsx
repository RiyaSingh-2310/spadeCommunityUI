import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminPagination from "../../../components/admin/AdminPagination";
import TableCard from "../../../components/admin/TableCard";
import TableEllipsisText from "../../../components/admin/TableEllipsisText";
import { useModulePermission } from "../../permissions/useModulePermission";
import { useApiListing } from "../../shared/hooks/useApiListing";
import {
  getEllipsisCellClassName,
  getEllipsisCellStyle,
  TABLE_ELLIPSIS_PX,
} from "../../shared/utils/tableHelpers";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { deleteRecord, getRecords } from "../../../services/activity/activityApi";

function LogActivityPage({ isDarkMode }) {
  const { canWrite } = useModulePermission("log_activity");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    rows,
    totalRecords,
    isLoading,
    listError,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
    totalPages,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });

  const handleDeleteRequest = useCallback((row) => {
    setDeleteTarget(row);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (isDeleting) return;
    setDeleteTarget(null);
  }, [isDeleting]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      const data = await deleteRecord(deleteTarget.id);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, refresh]);

  const safePage = Math.min(currentPage, totalPages);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Log Activity"
        subtitle="Track user actions and activity logs."
        isDarkMode={isDarkMode}
      />
      <DebouncedSearchInput
        value={query}
        onChange={setQuery}
        onDebouncedChange={handleSearch}
        placeholder="Search log activity..."
        isDarkMode={isDarkMode}
      />
      <TableCard
        isDarkMode={isDarkMode}
        footer={
          totalRecords > 0 ? (
            <AdminPagination
              isDarkMode={isDarkMode}
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={totalRecords}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : null
        }
      >
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-sm">
            <thead>
              <tr className="admin-text-muted">
                {["S.No", "Name", "Date and Time", ...(canWrite ? ["Action"] : [])].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold tracking-[0.02em] whitespace-nowrap ${
                      h === "Action" ? "admin-table-actions-col text-center" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className={`border-t ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}>
                  <td
                    colSpan={canWrite ? 4 : 3}
                    className="admin-text-muted px-4 py-8 text-center text-sm"
                  >
                    Loading...
                  </td>
                </tr>
              ) : listError ? (
                <tr className={`border-t ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}>
                  <td
                    colSpan={canWrite ? 4 : 3}
                    className="admin-text-muted px-4 py-8 text-center text-sm"
                  >
                    <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                      <p className="admin-text text-sm font-medium">{listError}</p>
                      <button
                        type="button"
                        onClick={refresh}
                        className="admin-btn-primary h-10 rounded-xl px-4 text-sm font-semibold"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr className={`border-t ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}>
                  <td
                    colSpan={canWrite ? 4 : 3}
                    className="admin-text-muted px-4 py-8 text-center text-sm"
                  >
                    No activity logs found
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const globalIdx = (safePage - 1) * pageSize + idx;

                  return (
                    <tr
                      key={row.id}
                      className={`border-t ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}
                    >
                      <td className="admin-text whitespace-nowrap px-4 py-3">{globalIdx + 1}</td>
                    <td
                      className={getEllipsisCellClassName(
                        TABLE_ELLIPSIS_PX.name,
                        "max-w-[250px] px-4 py-3 align-middle"
                      )}
                      style={getEllipsisCellStyle(TABLE_ELLIPSIS_PX.title)}
                    >
                      <TableEllipsisText>{row.nameDisplay ?? row.name}</TableEllipsisText>
                    </td>
                      <td className="admin-text whitespace-nowrap px-4 py-3">{row.logDate}</td>
                      {canWrite && (
                        <td className="admin-table-actions-col whitespace-nowrap px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(row)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--admin-danger-text)] transition-colors hover:bg-[var(--admin-danger-text)]/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TableCard>

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default LogActivityPage;
