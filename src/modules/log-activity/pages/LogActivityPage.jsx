import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminPagination from "../../../components/admin/AdminPagination";
import TableCard from "../../../components/admin/TableCard";
import { useModulePermission } from "../../permissions/useModulePermission";
import { useApiListing } from "../../shared/hooks/useApiListing";
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
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
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

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize) || 1);
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
                {["S.No", "Name", "Log Date", ...(canWrite ? ["Action"] : [])].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
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
                      <td className="max-w-[280px] px-4 py-3 align-middle">
                        <span
                          className="admin-text block truncate"
                          title={
                            row.nameDisplay && row.nameDisplay !== "—"
                              ? row.nameDisplay
                              : undefined
                          }
                        >
                          {row.nameDisplay ?? row.name}
                        </span>
                      </td>
                      <td className="admin-text whitespace-nowrap px-4 py-3">{row.logDate}</td>
                      {canWrite && (
                        <td className="whitespace-nowrap px-4 py-3">
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
