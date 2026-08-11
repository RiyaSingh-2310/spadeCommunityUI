import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useCsvExport } from "../../shared/hooks/useCsvExport";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import {
  compareTextAsc,
  getListingTextValue,
} from "../../shared/utils/nameColumnSort";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  deleteRecord,
  exportQuestionnaireGroupCsv,
  getRecords,
  updatePrescreenGroupStatus,
} from "../../../services/questionnaire-group/questionnaireGroupApi";

const LIST_COLUMNS = ["S.No", "Survey Title", "Language", "Website URL", "Status", "Action"];
const SORT_COLUMN = "Survey Title";

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
  } = useApiListing({
    fetchFn: getRecords,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });
  useListingRefresh(fetchPrescreenGroups);

  // Asc/desc by Survey Title only (not the shared newest→alpha cycle used elsewhere).
  const [columnSort, setColumnSort] = useState(null);
  const sortableColumns = useMemo(() => [SORT_COLUMN], []);

  const onColumnSort = useCallback((clickedColumn) => {
    if (clickedColumn !== SORT_COLUMN) return;
    setColumnSort((current) => {
      if (!current || current.column !== SORT_COLUMN) {
        return { column: SORT_COLUMN, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { column: SORT_COLUMN, direction: "desc" };
      }
      return null;
    });
  }, []);

  const sortedRows = useMemo(() => {
    if (!Array.isArray(rows) || rows.length <= 1 || !columnSort?.direction) {
      return Array.isArray(rows) ? rows : [];
    }

    const sorted = [...rows];
    sorted.sort((left, right) => {
      const cmp = compareTextAsc(
        getListingTextValue(left, SORT_COLUMN),
        getListingTextValue(right, SORT_COLUMN)
      );
      return columnSort.direction === "desc" ? -cmp : cmp;
    });
    return sorted;
  }, [rows, columnSort]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const handleDeleteRequest = (row) => {
    if (!row?.id) return;
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
      const data = await deleteRecord(deleteTarget.id);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await fetchPrescreenGroups();
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
      const data = await updatePrescreenGroupStatus(row.id, nextStatus);
      toastApiSuccess(data);
      await fetchPrescreenGroups();
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const exportCsv = useCallback(() => exportQuestionnaireGroupCsv(), []);
  const { isExporting, downloadCsv } = useCsvExport(exportCsv);

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Questionnaire Group"
        breadcrumbs={[{ label: "Questionnaire Group" }]}
        searchPlaceholder="Search questionnaire groups..."
        actionLabel="Add Survey Group"
        onActionClick={() => navigate("/prescreen/group/add")}
        csvExportLabel="Download CSV"
        onCsvExportClick={downloadCsv}
        isCsvExporting={isExporting}
        columns={LIST_COLUMNS}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="id"
        editPath="/prescreen/group"
        onDelete={handleDeleteRequest}
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

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default PrescreenGroupPage;
