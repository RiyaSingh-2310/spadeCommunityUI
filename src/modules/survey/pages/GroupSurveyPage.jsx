import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { getRecords, updateGroupProjectStatus } from "../services/groupSurveyApi";

function GroupSurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
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
    refresh: fetchGroupProjects,
    setRows,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(fetchGroupProjects);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: "Project Name",
  });

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const getGroupId = (row) => row?.id;

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const previousStatus = row.status;
    const nextStatus =
      String(previousStatus ?? "").toLowerCase() === "active" ? "Inactive" : "Active";
    setStatusUpdatingId(row.id);
    setRows((prev) =>
      prev.map((item) =>
        String(item.id) === String(row.id) ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const data = await updateGroupProjectStatus(row.id, { status: nextStatus });
      toastApiSuccess(data);
      await fetchGroupProjects();
    } catch (error) {
      toastApiError(error);
      setRows((prev) =>
        prev.map((item) =>
          String(item.id) === String(row.id) ? { ...item, status: previousStatus } : item
        )
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Group Survey"
      subtitle="Manage group survey records here."
      searchPlaceholder="Search group surveys..."
      actionLabel="Add Group Survey"
      onActionClick={() => navigate("/survey/group/add")}
      columns={["S. No.", "Client Name", "Project Name", "Status", "Action"]}
      rows={sortedRows}
      sortableColumns={sortableColumns}
      columnSort={columnSort}
      onColumnSort={onColumnSort}
      rowIdKey="id"
      actionVariant="group-survey"
      onStatusToggle={handleStatusToggle}
      isLoading={isLoading}
        errorMessage={listError}
        onRetry={fetchGroupProjects}
      emptyMessage="No group surveys found"
      onEdit={(row) => {
        const id = getGroupId(row);
        if (id == null) return;
        navigate(`/survey/group/edit/${encodeURIComponent(String(id))}`);
      }}
      onAddProject={(row) => {
        const id = getGroupId(row);
        if (id == null) return;
        navigate(`/survey/group/${encodeURIComponent(String(id))}/add-project`);
      }}
      onListProjects={(row) => {
        const id = getGroupId(row);
        if (id == null) return;
        navigate(`/survey/group/${encodeURIComponent(String(id))}/projects`);
      }}
      permissionModule="group_survey"
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

export default GroupSurveyPage;
