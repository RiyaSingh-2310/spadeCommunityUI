import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { getRecords, updateSurveyStatus } from "../services/surveyApi";

function SurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const {
    rows,
    setRows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchSurveys,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(fetchSurveys);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: "Project Name",
  });

  const handleStatusToggle = async (row) => {
    const recordId = row?.recordId;
    if (recordId == null) return;

    const previousStatus = row.status;
    const nextStatus =
      String(previousStatus ?? "").toLowerCase() === "active" ? "Inactive" : "Active";

    setRows((prev) =>
      prev.map((item) =>
        String(item.recordId) === String(recordId) ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const data = await updateSurveyStatus(recordId, { status: nextStatus });
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
      setRows((prev) =>
        prev.map((item) =>
          String(item.recordId) === String(recordId)
            ? { ...item, status: previousStatus }
            : item
        )
      );
    }
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Survey"
      subtitle="Manage survey records here."
      searchPlaceholder="Search surveys..."
      actionLabel="Add Survey"
      onActionClick={() => navigate("/survey/add")}
      columns={[
        "ID",
        "Project Name",
        "Client Code",
        "Start Date",
        "End Date",
        "Status",
        "Action",
      ]}
      rows={sortedRows}
      sortableColumns={sortableColumns}
      columnSort={columnSort}
      onColumnSort={onColumnSort}
      rowIdKey="recordId"
      actionVariant="view-edit"
      showDeleteAction={false}
      editPath="/survey"
      onView={(row) => {
        const id = row.recordId;
        if (id == null) return;
        navigate(`/survey/view/${encodeURIComponent(id)}`);
      }}
      onFindUser={(row) => {
        const id = row.recordId;
        if (id == null) return;
        navigate(`/survey/${encodeURIComponent(id)}/find-user`, {
          state: {
            surveyName: row.projectName || "Lifestyle Evolution India",
          },
        });
      }}
      onUserSurveyData={(row) => {
        const id = row.recordId;
        if (id == null) return;
        navigate(`/survey/${encodeURIComponent(id)}/user-survey-data`, {
          state: {
            surveyName: row.projectName || "Lifestyle Evaluation India",
          },
        });
      }}
      onSurveyClone={() => {
        // Future implementation: clone survey project
      }}
      onStatusToggle={handleStatusToggle}
      permissionModule="survey"
      isLoading={isLoading}
      emptyMessage="No Data Available"
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

export default SurveyPage;
