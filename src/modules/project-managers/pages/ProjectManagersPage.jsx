import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
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

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Project Managers"
      searchPlaceholder="Search project managers..."
      actionLabel="Add Project Manager"
      onActionClick={() => navigate("/project-managers/add")}
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
  );
}

export default ProjectManagersPage;
