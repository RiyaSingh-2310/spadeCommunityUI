import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useCsvExport } from "../../shared/hooks/useCsvExport";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  deleteProjectManager,
  exportProjectManagersCsv,
  getRecords,
  updateProjectManagerStatus,
} from "../../../services/projectManagers/projectManagersApi";

const LIST_COLUMNS = ["S.No", "Name", "Email Address", "Status", "Action"];

function ProjectManagersPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const {
    rows: projectManagers,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchProjectManagers,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(fetchProjectManagers);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows: projectManagers,
    columnLabel: "Name",
  });

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRequest = (row) => {
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      const data = await deleteProjectManager(deleteTarget.id);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await fetchProjectManagers();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    setStatusUpdatingId(row.id);

    try {
      const data = await updateProjectManagerStatus(row.id, {
        status: nextStatus,
      });
      toastApiSuccess(data);
      await fetchProjectManagers();
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const exportCsv = useCallback(() => exportProjectManagersCsv(), []);
  const { isExporting, downloadCsv } = useCsvExport(exportCsv);

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Project Managers"
        searchPlaceholder="Search project managers..."
        actionLabel="Add Project Manager"
        onActionClick={() => navigate("/project-managers/add")}
        csvExportLabel="Download CSV"
        onCsvExportClick={downloadCsv}
        isCsvExporting={isExporting}
        columns={LIST_COLUMNS}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="id"
        editPath="/project-managers"
        permissionModule="project_managers"
        isLoading={isLoading}
        emptyMessage="No project managers found"
        onDelete={handleDeleteRequest}
        onStatusToggle={handleStatusToggle}
        onSearch={handleSearch}
        totalRecords={totalRecords}
        serverPaginated
        serverSearch
        paginationPage={currentPage}
        onPaginationPageChange={handlePageChange}
        paginationPageSize={pageSize}
        onPaginationPageSizeChange={handlePageSizeChange}
        showPagination
        nowrapAllCells
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default ProjectManagersPage;
