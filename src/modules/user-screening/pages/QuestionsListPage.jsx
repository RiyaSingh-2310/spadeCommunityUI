import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import {
  deleteRecord,
  listPrescreenRecords,
  updatePrescreenStatus,
} from "../../../services/prescreen/prescreenQuestionnairesApi";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function QuestionsListPage({ isDarkMode }) {
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
    refresh,
  } = useApiListing({
    fetchFn: listPrescreenRecords,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });
  useListingRefresh(refresh);

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    setStatusUpdatingId(row.id);

    try {
      const data = await updatePrescreenStatus(row.id, nextStatus);
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleEdit = (row) => {
    navigate(`/user-screening/questions/edit/${row.id}`);
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Delete "${row.questionTitle}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const data = await deleteRecord(row.id);
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
    }
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="List of All Questions"
      searchPlaceholder="Search questions..."
      secondaryActionLabel="Sort Profiling Questions"
      onSecondaryActionClick={() => navigate("/user-screening/questions/sort")}
      actionLabel="Add Profiling Questions"
      onActionClick={() => navigate("/user-screening/questions/add")}
      columns={[
        "S.No",
        "Question Title",
        "Language",
        "Question Type",
        "Sort Order",
        "Status",
        "Action",
      ]}
      rows={rows}
      permissionModule="user_screening_management"
      nowrapAllCells
      rowIdKey="id"
      onEdit={handleEdit}
      onDelete={handleDelete}
      onStatusToggle={handleStatusToggle}
      isLoading={isLoading}
      emptyMessage="No questions found"
      onSearch={handleSearch}
      totalRecords={totalRecords}
      serverPaginated
      serverSearch
      paginationPage={currentPage}
      onPaginationPageChange={handlePageChange}
      paginationPageSize={pageSize}
      onPaginationPageSizeChange={handlePageSizeChange}
      showPagination
    />
  );
}

export default QuestionsListPage;
