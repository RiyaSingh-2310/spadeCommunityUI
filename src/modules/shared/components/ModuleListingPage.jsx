import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { useModulePermission } from "../../permissions/useModulePermission";
import {
  getModuleListingReadMode,
  getUserManagementActionFlags,
  hasNativeReadOnlyListingActions,
  shouldShowListingActionColumn,
} from "../../permissions/moduleListingPermissions";
import {
  isActionColumn,
  isProfileImageColumn,
  TABLE_STATUS_COL,
  TABLE_STATUS_COL_COMPACT,
} from "../utils/tableHelpers";
import { DEFAULT_PAGE_SIZE } from "../utils/pagination";
import { formatStatusLabel } from "../utils/statusLabels";
import { insertCheckboxBeforeName } from "./moduleListing/moduleListingUtils";
import ModuleListingTable from "./moduleListing/ModuleListingTable";
import ModuleListingToolbar from "./moduleListing/ModuleListingToolbar";
import { buildListingDataCellProps } from "./moduleListing/buildListingDataCellProps";
import { buildListingPaginationFooter } from "./moduleListing/buildListingPaginationFooter";
import { createListingCheckboxRenderers } from "./moduleListing/listingSelection";
import { useModuleListingPagination } from "./moduleListing/useModuleListingPagination";

function ModuleListingPage({
  isDarkMode,
  title,
  subtitle,
  breadcrumbs,
  hidePageHeader = false,
  searchPlaceholder = "Search records...",
  actionLabel = "Add",
  onActionClick,
  secondaryActionLabel,
  onSecondaryActionClick,
  csvExportLabel = "Download CSV",
  onCsvExportClick,
  isCsvExporting = false,
  csvExportDisabled = false,
  showCsvExport = false,
  columns = [],
  rows = [],
  showStatus = true,
  statusAsText = false,
  renderStatus = null,
  actionVariant = "edit-delete",
  showDeleteAction = true,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  showPagination = true,
  nowrapAllCells = false,
  rowIdKey = "id",
  onEdit,
  onDelete,
  editPath,
  onSearch,
  onStatusToggle,
  statusDropdownOptions = null,
  onStatusChange,
  onView,
  onFindUser,
  onUserSurveyData,
  onSurveyClone,
  onProjectUrlInfo,
  onClone,
  onCopy,
  onAddProject,
  onListProjects,
  onAddLog,
  onViewLogs,
  onRewardLog,
  onResendEmail,
  onDownload,
  surveyActionLabels,
  onApprove,
  onReject,
  onPdfDownload,
  onManagePermissions,
  permissionModule = null,
  isLoading = false,
  errorMessage = "",
  onRetry = null,
  emptyMessage = "No records found",
  searchFields = null,
  toolbarEnd = null,
  toolbarFilters = null,
  renderToolbar = null,
  sortableColumns = null,
  columnSort = null,
  onColumnSort = null,
  selectable = false,
  selectedRowIds = null,
  onSelectedRowIdsChange = null,
  onBulkDeleteRequest = null,
  hideSelectAllCheckbox = false,
  totalRecords = null,
  serverPaginated = false,
  serverSearch = false,
  paginationPage = 1,
  onPaginationPageChange,
  paginationPageSize,
  onPaginationPageSizeChange,
  nameAsText = false,
  renderExpandedContent = null,
  compactStatusColumn = false,
  compactTable = false,
  descriptionMaxLines = null,
  getRowClassName = null,
}) {
  const navigate = useNavigate();
  const {
    canRead: allowRead,
    canWrite: allowWrite,
    filterColumns,
  } = useModulePermission(permissionModule);

  const [internalData, setInternalData] = useState(() =>
    (Array.isArray(rows) ? rows : []).filter(Boolean)
  );
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState(() => new Set());
  const hasExpandColumn = Boolean(renderExpandedContent);

  const safeColumns = Array.isArray(columns) ? columns : [];
  const hasActionColumn = safeColumns.some(isActionColumn);
  const isExternallyManaged = Boolean(
    onStatusToggle ||
      onStatusChange ||
      onEdit ||
      onDelete ||
      onManagePermissions ||
      onAddProject ||
      onListProjects
  );
  const editOnly = actionVariant === "edit-only";
  const viewEdit = actionVariant === "view-edit";
  const pdfDownload = actionVariant === "pdf-download";
  const userManagement = actionVariant === "user-management";
  const groupSurvey = actionVariant === "group-survey";
  const groupSurveyProjects = actionVariant === "group-survey-projects";
  const rfq = actionVariant === "rfq";
  const communityUser = actionVariant === "community-user";
  const usesControlledSelection =
    selectable && selectedRowIds instanceof Set && onSelectedRowIdsChange;

  const {
    query,
    handleQueryChange,
    pageSize,
    usesServerListing,
    normalizedQuery,
    filtered,
    pagination,
    handlePageChange,
    handlePageSizeChange,
  } = useModuleListingPagination({
    rows,
    rowIdKey,
    isExternallyManaged,
    internalData,
    setInternalData,
    serverPaginated,
    serverSearch,
    paginationPage,
    paginationPageSize,
    initialPageSize,
    onPaginationPageChange,
    onPaginationPageSizeChange,
    totalRecords,
    searchFields,
  });

  const toggleRowExpanded = useCallback((rowId) => {
    if (rowId == null) return;
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      const key = String(rowId);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const getRowId = useCallback(
    (row) => row?.[rowIdKey] ?? row?.id,
    [rowIdKey]
  );

  const handleEdit = useCallback(
    (row, globalIdx) => {
      if (onEdit) {
        onEdit(row, globalIdx);
        return;
      }
      if (!editPath) return;
      const id = getRowId(row);
      if (id == null) return;
      navigate(`${editPath.replace(/\/$/, "")}/edit/${encodeURIComponent(id)}`);
    },
    [onEdit, editPath, getRowId, navigate]
  );

  const handleDeleteRequest = useCallback(
    (row, globalIdx) => {
      if (onDelete) {
        onDelete(row, globalIdx);
        return;
      }
      setPendingDelete({ row, globalIdx });
    },
    [onDelete]
  );

  const handleDeleteCancel = useCallback(() => {
    if (isDeleting) return;
    setPendingDelete(null);
  }, [isDeleting]);

  const handleDeleteConfirm = useCallback(() => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const { row } = pendingDelete;
      const id = getRowId(row);
      setInternalData((prev) =>
        prev.filter((item) => String(getRowId(item)) !== String(id))
      );
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, getRowId]);

  const listingReadMode = getModuleListingReadMode(permissionModule);
  const statusColumnClass = compactStatusColumn
    ? TABLE_STATUS_COL_COMPACT
    : TABLE_STATUS_COL;

  const readOnlyListingActions = hasNativeReadOnlyListingActions({
    permissionModule,
    actionVariant,
    onView,
    onFindUser,
    onUserSurveyData,
    onSurveyClone,
    onProjectUrlInfo,
    onPdfDownload,
    onApprove,
    onReject,
    onListProjects,
    onViewLogs,
    onRewardLog,
    onDownload,
  });

  const userMgmtActions = userManagement
    ? getUserManagementActionFlags({
        allowWrite,
        onEdit,
        editPath,
        onDelete,
        showDeleteAction,
      })
    : null;

  const canShowEdit = allowWrite && Boolean(onEdit || editPath);
  const canShowDelete =
    allowWrite &&
    showDeleteAction &&
    !editOnly &&
    (!viewEdit || Boolean(onDelete)) &&
    !pdfDownload &&
    !groupSurvey &&
    Boolean(onDelete || hasActionColumn);
  const canShowManagePermissions =
    allowWrite && userManagement && Boolean(onManagePermissions);
  const effectiveStatusToggle = allowWrite ? onStatusToggle : undefined;
  const effectiveStatusAsText = statusAsText;
  const showAddButton = Boolean(onActionClick && allowWrite);
  const showSecondaryAction = Boolean(
    onSecondaryActionClick && secondaryActionLabel && allowWrite
  );
  const showCsvExportButton = Boolean(
    csvExportLabel && (showCsvExport || onCsvExportClick)
  );

  const paginationFooter = buildListingPaginationFooter({
    showPagination,
    isLoading,
    filteredLength: filtered.length,
    usesServerListing,
    totalRecords,
    isDarkMode,
    pagination,
    normalizedQuery,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  });

  const displayColumns = useMemo(() => {
    let cols = filterColumns(safeColumns);
    const showActionColumn = shouldShowListingActionColumn({
      permissionModule,
      actionVariant,
      allowRead,
      allowWrite,
      onView,
      onEdit,
      onDelete,
      editPath,
      showDeleteAction,
      onManagePermissions,
      onFindUser,
      onUserSurveyData,
      onSurveyClone,
      onProjectUrlInfo,
      onClone,
      onCopy,
      onPdfDownload,
      onApprove,
      onReject,
      onListProjects,
      onAddLog,
      onViewLogs,
      onRewardLog,
      onDownload,
      hasActionColumn,
    });
    if (!showActionColumn && hasActionColumn) {
      cols = cols.filter((col) => !isActionColumn(col));
    }
    return cols;
  }, [
    safeColumns, filterColumns, permissionModule, actionVariant, allowRead, allowWrite,
    onView, onEdit, onDelete, editPath, showDeleteAction, onManagePermissions, onFindUser,
    onUserSurveyData, onSurveyClone, onProjectUrlInfo, onClone, onCopy, onPdfDownload, onApprove, onReject,
    onListProjects, onAddLog, onViewLogs, onRewardLog, onDownload, hasActionColumn,
  ]);

  const formatStatusDisplay = (row) =>
    formatStatusLabel(row.statusLabel ?? row.status);

  const hasProfileImageColumn = safeColumns.some(isProfileImageColumn);
  const tableColumns = useMemo(
    () => insertCheckboxBeforeName(displayColumns, selectable),
    [displayColumns, selectable]
  );
  const sortableColumnSet = useMemo(
    () => new Set(Array.isArray(sortableColumns) ? sortableColumns : []),
    [sortableColumns]
  );

  const visibleRowIds = useMemo(
    () =>
      pagination.items
        .map((row) => getRowId(row))
        .filter((rowId) => rowId != null)
        .map((rowId) => String(rowId)),
    [pagination.items, getRowId]
  );
  const allVisibleSelected =
    visibleRowIds.length > 0 &&
    visibleRowIds.every((rowId) => selectedRowIds?.has(rowId));
  const someVisibleSelected =
    visibleRowIds.some((rowId) => selectedRowIds?.has(rowId)) &&
    !allVisibleSelected;

  const handleToggleAllVisible = useCallback(
    (checked) => {
      if (!usesControlledSelection) return;
      onSelectedRowIdsChange((prev) => {
        const next = new Set(prev);
        if (checked) visibleRowIds.forEach((rowId) => next.add(rowId));
        else visibleRowIds.forEach((rowId) => next.delete(rowId));
        return next;
      });
    },
    [usesControlledSelection, onSelectedRowIdsChange, visibleRowIds]
  );

  const handleToggleRowSelection = useCallback(
    (rowId) => {
      if (!usesControlledSelection || rowId == null) return;
      const key = String(rowId);
      onSelectedRowIdsChange((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [usesControlledSelection, onSelectedRowIdsChange]
  );

  const { renderCheckboxHeader, renderCheckboxCell } = createListingCheckboxRenderers({
    hideSelectAllCheckbox,
    allVisibleSelected,
    someVisibleSelected,
    handleToggleAllVisible,
    visibleRowIds,
    isLoading,
    onBulkDeleteRequest,
    selectedRowIds,
    isDeleting,
    handleToggleRowSelection,
  });

  return (
    <div className={`min-w-0 space-y-6 ${hidePageHeader ? "" : "admin-page-root"}`}>
      {!hidePageHeader ? (
        <AdminPageHeader
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          isDarkMode={isDarkMode}
        />
      ) : null}

      <ModuleListingToolbar
        renderToolbar={renderToolbar}
        query={query}
        handleQueryChange={handleQueryChange}
        onSearch={onSearch}
        searchPlaceholder={searchPlaceholder}
        isDarkMode={isDarkMode}
        toolbarFilters={toolbarFilters}
        toolbarEnd={toolbarEnd}
        showSecondaryAction={showSecondaryAction}
        onSecondaryActionClick={onSecondaryActionClick}
        secondaryActionLabel={secondaryActionLabel}
        showAddButton={showAddButton}
        onActionClick={onActionClick}
        actionLabel={actionLabel}
        showCsvExportButton={showCsvExportButton}
        onCsvExportClick={onCsvExportClick}
        isCsvExporting={isCsvExporting}
        csvExportDisabled={csvExportDisabled}
        csvExportLabel={csvExportLabel}
      />

      <ModuleListingTable
        paginationFooter={paginationFooter}
        compactTable={compactTable}
        hasExpandColumn={hasExpandColumn}
        tableColumns={tableColumns}
        statusColumnClass={statusColumnClass}
        sortableColumnSet={sortableColumnSet}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        renderCheckboxHeader={renderCheckboxHeader}
        bodyProps={{
          isLoading,
          errorMessage,
          onRetry,
          emptyMessage,
          filteredLength: filtered.length,
          pagination,
          pageSize,
          getRowId,
          hasExpandColumn,
          expandedRowIds,
          toggleRowExpanded,
          getRowClassName,
          tableColumns,
          renderExpandedContent,
          dataCellProps: buildListingDataCellProps({
            rowIdKey, renderCheckboxCell, showStatus, rfq, renderStatus, effectiveStatusAsText,
            formatStatusDisplay, statusColumnClass, statusDropdownOptions, allowWrite,
            isDarkMode, onStatusChange, setInternalData, effectiveStatusToggle,
            compactStatusColumn, allowRead, onView, actionVariant, readOnlyListingActions,
            listingReadMode, communityUser, groupSurveyProjects, userMgmtActions,
            canShowEdit, canShowDelete, canShowManagePermissions, editPath, showDeleteAction,
            onEdit, onDelete, onManagePermissions, onFindUser, onUserSurveyData, onSurveyClone,
            onProjectUrlInfo, onClone, onCopy, onPdfDownload, onApprove, onReject, onAddProject, onListProjects,
            onAddLog, onViewLogs, onRewardLog, onResendEmail, onDownload, surveyActionLabels,
            handleEdit, handleDeleteRequest, hasProfileImageColumn, nameAsText, nowrapAllCells,
            descriptionMaxLines,
          }),
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(pendingDelete) && !onDelete}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default ModuleListingPage;
