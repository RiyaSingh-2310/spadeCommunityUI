import { useCallback, useMemo, useState } from "react";
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
  deleteRecord,
  exportQuestionnaireGroupCsv,
  getRecords,
  updatePrescreenGroupStatus,
} from "../../../services/questionnaire-group/questionnaireGroupApi";
import QuestionnaireGroupListFilters from "../components/QuestionnaireGroupListFilters";

const LIST_COLUMNS = [
  "S.No",
  "Questionnaire Group",
  "Language",
  "Website URL",
  "Question Count",
  "Status",
  "Created At",
  "Action",
];
const SORT_COLUMN = "Questionnaire Group";

function PrescreenGroupPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const [statusFilter, setStatusFilter] = useState("active");
  const [languageFilter, setLanguageFilter] = useState("all");

  const fetchGroups = useCallback(
    async (params) =>
      getRecords({
        ...params,
        status: statusFilter,
        language: languageFilter,
      }),
    [statusFilter, languageFilter]
  );

  const {
    rows,
    totalRecords,
    totalPages,
    isLoading,
    listError,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchPrescreenGroups,
  } = useApiListing({
    fetchFn: fetchGroups,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });
  useListingRefresh(fetchPrescreenGroups);

  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: SORT_COLUMN,
  });

  const extraLanguages = useMemo(
    () =>
      [...new Set(rows.map((row) => String(row.languageSlug ?? "").trim().toLowerCase()).filter(Boolean))],
    [rows]
  );

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    handlePageChange(1);
  };

  const handleLanguageFilterChange = (value) => {
    setLanguageFilter(value);
    handlePageChange(1);
  };

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
      toastApiSuccess(data, "Prescreen group deleted successfully.");
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
      toastApiSuccess(
        data,
        nextStatus === "Active"
          ? "Prescreen group activated successfully."
          : "Prescreen group deactivated successfully."
      );
      await fetchPrescreenGroups();
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const exportCsv = useCallback(() => exportQuestionnaireGroupCsv(), []);
  const { isExporting, downloadCsv } = useCsvExport(exportCsv);

  const toolbarFilters = (
    <QuestionnaireGroupListFilters
      status={statusFilter}
      language={languageFilter}
      extraLanguages={extraLanguages}
      onStatusChange={handleStatusFilterChange}
      onLanguageChange={handleLanguageFilterChange}
    />
  );

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
        toolbarFilters={toolbarFilters}
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
        errorMessage={listError}
        onRetry={fetchPrescreenGroups}
        emptyMessage="No questionnaire groups found"
        onSearch={handleSearch}
        totalRecords={totalRecords}
        paginationTotalPages={totalPages}
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
