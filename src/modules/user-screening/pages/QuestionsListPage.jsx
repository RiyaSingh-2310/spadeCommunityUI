import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import {
  getScreeningRowId,
  listScreeningRecords,
  deleteScreeningQuestion,
  updateScreeningQuestionStatus,
} from "../../../services/screening/screeningQuestionsApi";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function compareSnoValues(left, right) {
  const leftNum = Number(left);
  const rightNum = Number(right);

  if (Number.isFinite(leftNum) && Number.isFinite(rightNum)) {
    return leftNum - rightNum;
  }

  return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function QuestionsListPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const [snoSort, setSnoSort] = useState(null);

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
    refresh,
  } = useApiListing({
    fetchFn: listScreeningRecords,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayRows = useMemo(() => {
    if (!snoSort) return rows;

    const sorted = [...rows];
    sorted.sort((left, right) => {
      const comparison = compareSnoValues(left?.id, right?.id);
      return snoSort === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [rows, snoSort]);

  const columnSort = useMemo(
    () => (snoSort ? { column: "S.No", direction: snoSort } : null),
    [snoSort]
  );

  const handleColumnSort = useCallback((column) => {
    if (column !== "S.No") return;

    setSnoSort((current) => {
      if (current === null) return "asc";
      if (current === "asc") return "desc";
      return null;
    });
  }, []);

  const handleStatusToggle = async (row) => {
    const rowId = getScreeningRowId(row);
    if (rowId == null || statusUpdatingId != null) return;

    const previousStatus = row.status;
    const nextStatus =
      String(previousStatus ?? "").toLowerCase() === "active" ? "Inactive" : "Active";

    setStatusUpdatingId(rowId);
    setRows((prev) =>
      prev.map((item) =>
        String(getScreeningRowId(item)) === String(rowId)
          ? { ...item, status: nextStatus }
          : item
      )
    );

    try {
      const data = await updateScreeningQuestionStatus(rowId, nextStatus);
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
      setRows((prev) =>
        prev.map((item) =>
          String(getScreeningRowId(item)) === String(rowId)
            ? { ...item, status: previousStatus }
            : item
        )
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleEdit = (row) => {
    const rowId = getScreeningRowId(row);
    if (rowId == null) return;
    navigate(`/user-screening/questions/edit/${encodeURIComponent(String(rowId))}`);
  };

  const handleDeleteRequest = (row) => {
    const rowId = getScreeningRowId(row);
    if (rowId == null) return;
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    const rowId = getScreeningRowId(deleteTarget);
    if (rowId == null) return;

    setIsDeleting(true);
    try {
      const data = await deleteScreeningQuestion(rowId);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Panel Questionnaire"
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
        rows={displayRows}
        permissionModule="user_screening_management"
        nowrapAllCells
        rowIdKey="id"
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
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
        sortableColumns={["S.No"]}
        columnSort={columnSort}
        onColumnSort={handleColumnSort}
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

export default QuestionsListPage;
