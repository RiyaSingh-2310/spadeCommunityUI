import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  getRecords,
  updatePrescreenGroupStatus,
} from "../../../services/questionnaire-group/questionnaireGroupApi";

const LIST_COLUMNS = ["S.No", "Survey Title", "Language", "Status", "Action"];

function PrescreenGroupPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const {
    rows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchPrescreenGroups,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(fetchPrescreenGroups);

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    setStatusUpdatingId(row.id);

    try {
      const data = await updatePrescreenGroupStatus(row.id, nextStatus);
      toastApiSuccess(data);
      await fetchPrescreenGroups();
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Questionnaire Group"
      searchPlaceholder="Search questionnaire groups..."
      actionLabel="Add Survey Group"
      onActionClick={() => navigate("/prescreen/group/add")}
      columns={LIST_COLUMNS}
      rows={rows}
      rowIdKey="id"
      editPath="/prescreen/group"
      permissionModule="prescreen_group"
      onStatusToggle={handleStatusToggle}
      isLoading={isLoading}
      emptyMessage="No questionnaire groups found"
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

export default PrescreenGroupPage;
