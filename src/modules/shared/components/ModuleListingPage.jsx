import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Minus, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminPagination from "../../../components/admin/AdminPagination";
import AvatarNameCell from "../../../components/admin/AvatarNameCell";
import Avatar from "../../../components/shared/Avatar";
import { resolveAvatarFromRecord } from "../utils/userAvatar";
import TableLoadingSkeleton from "../../../components/admin/TableLoadingSkeleton";
import StatusToggle from "../../../components/admin/StatusToggle";
import { useModulePermission } from "../../permissions/useModulePermission";
import {
  getModuleListingReadMode,
  getUserManagementActionFlags,
  hasNativeReadOnlyListingActions,
  shouldShowListingActionColumn,
} from "../../permissions/moduleListingPermissions";
import ViewActionButton from "../../../components/admin/ViewActionButton";
import TableCard from "../../../components/admin/TableCard";
import AdminSummaryCards from "../../../components/admin/AdminSummaryCards";
import {
  getColumnKey,
  getRowValue,
  isActionColumn,
  isDetailsColumn,
  isNowrapDataColumn,
  isIdColumn,
  isCheckboxColumn,
  isDescriptionColumn,
  isProfileImageColumn,
  isSnoColumn,
  isStatusColumn,
  TABLE_HEAD_BASE,
  TABLE_STATUS_COL,
  TABLE_STATUS_COL_COMPACT,
} from "../utils/tableHelpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { DEFAULT_PAGE_SIZE, paginateItems } from "../utils/pagination";
import { formatStatusLabel } from "../utils/statusLabels";
import TableStatusSelect from "../../../components/admin/TableStatusSelect";
import { normalizeSearchQuery, rowMatchesSearchQuery } from "../utils/searchQuery";
import ModuleListingActionCell from "./moduleListing/ModuleListingActionCell";
import RfqStatusBadge from "../../sales/components/RfqStatusBadge";
import {
  formatDescriptionForLineClamp,
  insertCheckboxBeforeName,
} from "./moduleListing/moduleListingUtils";

function ModuleListingPage({
  isDarkMode,
  title,
  subtitle,
  breadcrumbs,
  /** When true, skips AdminPageHeader (e.g. embedded tab listings). */
  hidePageHeader = false,
  // summaryCards,
  searchPlaceholder = "Search records...",
  actionLabel = "Add",
  onActionClick,
  secondaryActionLabel,
  onSecondaryActionClick,
  columns = [],
  rows = [],
  showStatus = true,
  statusAsText = false,
  actionVariant = "edit-delete",
  showDeleteAction = true,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  showPagination = true,
  nowrapAllCells = false,
  rowIdKey = "id",
  onEdit,
  onDelete,
  /** Base route for default edit navigation, e.g. "/partners" → /partners/edit/:id */
  editPath,
  onSearch,
  onStatusToggle,
  /** When set, status column renders as a themed dropdown (e.g. Approved / Rejected). */
  statusDropdownOptions = null,
  onStatusChange,
  onView,
  onFindUser,
  onUserSurveyData,
  onSurveyClone,
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
  /** Permission module key, e.g. "clients" — gates add/edit/delete/status */
  permissionModule = null,
  isLoading = false,
  emptyMessage = "No records found",
  searchFields = null,
  toolbarEnd = null,
  toolbarFilters = null,
  /** When set, replaces the default search + toolbarFilters layout. */
  renderToolbar = null,
  sortableColumns = null,
  columnSort = null,
  onColumnSort = null,
  selectable = false,
  selectedRowIds = null,
  onSelectedRowIdsChange = null,
  onBulkDeleteRequest = null,
  /** When true, hides the select-all checkbox in the table header (row checkboxes remain). */
  hideSelectAllCheckbox = false,
  /** API total record count (used for pagination summary when not searching). */
  totalRecords = null,
  /** When true, rows are already paginated by the API; parent controls page + page size. */
  serverPaginated = false,
  /** When true, search is API-driven; disables client-side filtering. */
  serverSearch = false,
  paginationPage = 1,
  onPaginationPageChange,
  paginationPageSize,
  onPaginationPageSizeChange,
  /** When true, Name column shows plain text instead of avatar + name. */
  nameAsText = false,
  /** When set, prepends an expand column and renders content below expanded rows. */
  renderExpandedContent = null,
  /** Use a narrower fixed-width status column (e.g. group survey inner listing). */
  compactStatusColumn = false,
  /** Tighter cell padding for dense listings (e.g. reward tables). */
  compactTable = false,
  /** When set, description cells clamp to this many lines (user email templates). */
  descriptionMaxLines = null,
  /** Optional row className resolver for unread/highlight styles. */
  getRowClassName = null,
}) {
  const navigate = useNavigate();
  const {
    canRead: allowRead,
    canWrite: allowWrite,
    filterColumns,
  } = useModulePermission(permissionModule);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);
  const usesServerListing = serverPaginated || serverSearch;
  const currentPage = usesServerListing ? paginationPage : internalCurrentPage;
  const pageSize = usesServerListing ? (paginationPageSize ?? initialPageSize) : internalPageSize;
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
  const usesControlledSelection = selectable && selectedRowIds instanceof Set && onSelectedRowIdsChange;

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

  const safeRows = (Array.isArray(rows) ? rows : []).filter(Boolean);

  const rowsSignature = safeRows.map((row) => row?.[rowIdKey] ?? row?.id ?? "").join(",");
  const [prevRowsSignature, setPrevRowsSignature] = useState(rowsSignature);
  if (!isExternallyManaged && rowsSignature !== prevRowsSignature) {
    setPrevRowsSignature(rowsSignature);
    setInternalData(safeRows);
  }

  const rawData = isExternallyManaged ? safeRows : internalData;
  const data = Array.isArray(rawData) ? rawData.filter(Boolean) : [];

  const handlePageChange = useCallback(
    (nextPage) => {
      if (usesServerListing) {
        onPaginationPageChange?.(nextPage);
        return;
      }
      setInternalCurrentPage(nextPage);
    },
    [usesServerListing, onPaginationPageChange]
  );

  const handlePageSizeChange = useCallback(
    (nextSize) => {
      if (usesServerListing) {
        onPaginationPageSizeChange?.(nextSize);
        return;
      }
      setInternalPageSize(nextSize);
      setInternalCurrentPage(1);
    },
    [usesServerListing, onPaginationPageSizeChange]
  );

  const handleQueryChange = (value) => {
    setQuery(value);
    if (!usesServerListing) {
      setInternalCurrentPage(1);
    }
  };

  const normalizedQuery = normalizeSearchQuery(debouncedQuery).toLowerCase();

  const filtered = usesServerListing
    ? data
    : data.filter((row) => rowMatchesSearchQuery(row, debouncedQuery, searchFields));

  const paginationTotalItems = usesServerListing
    ? totalRecords ?? filtered.length
    : normalizedQuery
      ? filtered.length
      : totalRecords ?? filtered.length;

  const pagination = useMemo(() => {
    if (usesServerListing) {
      const totalPages = Math.max(1, Math.ceil(paginationTotalItems / pageSize) || 1);
      const safePage = Math.min(Math.max(1, currentPage), totalPages);

      return {
        items: filtered,
        currentPage: safePage,
        totalPages,
        totalItems: paginationTotalItems,
        pageSize,
      };
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
    const safePage = Math.min(currentPage, totalPages);
    const slice = paginateItems(filtered, safePage, pageSize);

    return {
      ...slice,
      totalItems: paginationTotalItems,
    };
  }, [
    filtered,
    currentPage,
    pageSize,
    paginationTotalItems,
    usesServerListing,
  ]);

  useEffect(() => {
    if (usesServerListing) return;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
    setInternalCurrentPage((prev) => Math.min(prev, pages));
  }, [filtered.length, pageSize, debouncedQuery, usesServerListing]);

  const hasProfileImageColumn = safeColumns.some(isProfileImageColumn);

  const paginationFooter =
    showPagination &&
    !isLoading &&
    (filtered.length > 0 || (usesServerListing && (totalRecords ?? 0) > 0)) ? (
      <AdminPagination
        isDarkMode={isDarkMode}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        visibleItemCount={
          totalRecords != null && (usesServerListing || !normalizedQuery)
            ? usesServerListing
              ? pagination.currentPage >= pagination.totalPages
                ? pagination.totalItems
                : Math.min(pagination.currentPage * pageSize, pagination.totalItems)
              : Math.min(
                  (pagination.currentPage - 1) * pageSize + pagination.items.length,
                  pagination.totalItems
                )
            : null
        }
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    ) : null;

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
    safeColumns,
    filterColumns,
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
    onPdfDownload,
    onApprove,
    onReject,
    onListProjects,
    onAddLog,
    onViewLogs,
    onRewardLog,
    onDownload,
    hasActionColumn,
  ]);

  const formatStatusDisplay = (row) =>
    formatStatusLabel(row.statusLabel ?? row.status);

  const visibleRowIds = useMemo(
    () =>
      pagination.items
        .map((row) => getRowId(row))
        .filter((rowId) => rowId != null)
        .map((rowId) => String(rowId)),
    [pagination.items, getRowId]
  );

  const allVisibleSelected =
    visibleRowIds.length > 0 && visibleRowIds.every((rowId) => selectedRowIds?.has(rowId));
  const someVisibleSelected =
    visibleRowIds.some((rowId) => selectedRowIds?.has(rowId)) && !allVisibleSelected;

  const handleToggleAllVisible = useCallback(
    (checked) => {
      if (!usesControlledSelection) return;
      onSelectedRowIdsChange((prev) => {
        const next = new Set(prev);
        if (checked) {
          visibleRowIds.forEach((rowId) => next.add(rowId));
        } else {
          visibleRowIds.forEach((rowId) => next.delete(rowId));
        }
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

  const renderCheckboxHeader = () => (
    <th className={`${TABLE_HEAD_BASE} text-left`}>
      {hideSelectAllCheckbox ? (
        <span className="sr-only">Select</span>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="admin-checkbox"
            checked={allVisibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = someVisibleSelected;
            }}
            onChange={(event) => handleToggleAllVisible(event.target.checked)}
            disabled={visibleRowIds.length === 0 || isLoading}
            aria-label="Select all rows"
          />
          {onBulkDeleteRequest && (selectedRowIds?.size ?? 0) > 0 && (
            <button
              type="button"
              onClick={onBulkDeleteRequest}
              disabled={isLoading || isDeleting}
              className="inline-flex items-center justify-center rounded-md p-1 text-[var(--admin-danger-text)] transition-colors hover:bg-[var(--admin-danger-text)]/10 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Delete selected rows"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </th>
  );

  const renderCheckboxCell = (rowId) => (
    <td className="px-4 py-3 align-middle whitespace-nowrap">
      <input
        type="checkbox"
        className="admin-checkbox"
        checked={selectedRowIds?.has(String(rowId)) ?? false}
        onChange={() => handleToggleRowSelection(rowId)}
        aria-label="Select row"
      />
    </td>
  );

  const tableColumns = useMemo(
    () => insertCheckboxBeforeName(displayColumns, selectable),
    [displayColumns, selectable]
  );

  const sortableColumnSet = useMemo(
    () => new Set(Array.isArray(sortableColumns) ? sortableColumns : []),
    [sortableColumns]
  );

  const renderSortableHeader = (columnLabel) => {
    const isActive = columnSort?.column === columnLabel;
    const direction = columnSort?.direction;
    const upActive = isActive && direction === "asc";
    const downActive = isActive && direction === "desc";

    return (
      <button
        type="button"
        onClick={() => onColumnSort?.(columnLabel)}
        className={`admin-table-sort-trigger inline-flex cursor-pointer items-center gap-1.5 transition hover:text-[var(--admin-foreground)] ${
          isActive ? "text-[var(--admin-primary-color)]" : ""
        }`}
        aria-label={`Sort by ${columnLabel}`}
      >
        <span>{columnLabel}</span>
        <span className="inline-flex flex-col leading-none" aria-hidden>
          <ArrowUp
            size={11}
            strokeWidth={2.5}
            className={upActive ? "text-[var(--admin-primary-color)]" : "opacity-35"}
          />
          <ArrowDown
            size={11}
            strokeWidth={2.5}
            className={`-mt-0.5 ${downActive ? "text-[var(--admin-primary-color)]" : "opacity-35"}`}
          />
        </span>
      </button>
    );
  };

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

      {/* {summaryCards?.length > 0 ? <AdminSummaryCards cards={summaryCards} /> : null} */}

      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {renderToolbar ? (
          <div className="w-full min-w-0">
            {renderToolbar({
              query,
              onQueryChange: handleQueryChange,
              onDebouncedSearch: onSearch,
              searchPlaceholder,
              isDarkMode,
            })}
          </div>
        ) : toolbarFilters ? (
          <div className="flex min-w-0 w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between">
            <DebouncedSearchInput
              value={query}
              onChange={handleQueryChange}
              onDebouncedChange={onSearch}
              placeholder={searchPlaceholder}
              isDarkMode={isDarkMode}
              className="min-w-0 w-full shrink-0 md:min-w-[12rem] md:flex-1"
              maxWidthClass="md:max-w-none lg:max-w-[340px]"
            />
            <div className="admin-toolbar-filters flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end md:w-auto">
              {toolbarFilters}
            </div>
          </div>
        ) : (
          <DebouncedSearchInput
            value={query}
            onChange={handleQueryChange}
            onDebouncedChange={onSearch}
            placeholder={searchPlaceholder}
            isDarkMode={isDarkMode}
            className="min-w-0 w-full lg:flex-1"
            maxWidthClass="lg:max-w-[340px]"
          />
        )}
        {(toolbarEnd || showSecondaryAction || showAddButton) && (
          <div className="flex w-full shrink-0 flex-wrap items-center justify-stretch gap-2.5 sm:justify-end lg:w-auto">
            {toolbarEnd}
            {showSecondaryAction && (
              <button
                type="button"
                onClick={onSecondaryActionClick}
                className="admin-btn-cancel h-10 w-full rounded-xl px-4 text-sm font-semibold transition sm:w-auto"
              >
                {secondaryActionLabel}
              </button>
            )}
            {showAddButton && (
              <button
                type="button"
                onClick={onActionClick}
                className="admin-btn-primary w-full shrink-0 sm:w-auto"
              >
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </div>

      <TableCard footer={paginationFooter} flush>
          <table
            className={`admin-table min-w-full text-sm${compactTable ? " admin-table-compact" : ""}`}
          >
          <thead>
            <tr className="admin-text-muted">
              {hasExpandColumn && (
                <th className={`${TABLE_HEAD_BASE} w-12 text-left`} aria-label="Expand row">
                  <span className="sr-only">Expand</span>
                </th>
              )}
              {tableColumns.map((h) => {
                if (isCheckboxColumn(h)) {
                  return <Fragment key="select-all">{renderCheckboxHeader()}</Fragment>;
                }
                return (
                <th
                  key={h}
                  className={`${TABLE_HEAD_BASE} ${
                    isStatusColumn(h) ? `admin-table-status-col ${statusColumnClass}` : ""
                  } ${isActionColumn(h) ? "admin-table-actions-col text-right" : "text-left"}`}
                >
                  {sortableColumnSet.has(h) && onColumnSort
                    ? renderSortableHeader(h)
                    : h}
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableLoadingSkeleton
                columns={hasExpandColumn ? ["", ...tableColumns] : tableColumns}
              />
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={tableColumns.length + (hasExpandColumn ? 1 : 0)}
                  className="admin-text-muted px-4 py-16 text-center text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
            pagination.items.map((row, idx) => {
              const globalIdx = (pagination.currentPage - 1) * pageSize + idx;
              const rowKey = row[rowIdKey] || row.id || row.name || idx;
              const rowId = getRowId(row);
              const isExpanded = hasExpandColumn && expandedRowIds.has(String(rowId));
              const rowClassName =
                typeof getRowClassName === "function"
                  ? getRowClassName(row, globalIdx)
                  : "";
              return (
              <Fragment key={rowKey}>
              <tr
                className={`admin-table-row align-middle${rowClassName ? ` ${rowClassName}` : ""}`}
              >
                {hasExpandColumn && (
                  <td className="px-3 py-3 align-middle whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleRowExpanded(rowId)}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition hover:opacity-90 ${
                        isExpanded
                          ? "border-[var(--admin-danger-text)] text-[var(--admin-danger-text)]"
                          : "border-[var(--admin-primary-color)] text-[var(--admin-primary-color)]"
                      }`}
                      aria-label={isExpanded ? "Collapse row" : "Expand row"}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <Minus size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                    </button>
                  </td>
                )}
                {tableColumns.map((col) => {
                  if (isCheckboxColumn(col)) {
                    return <Fragment key="row-select">{renderCheckboxCell(rowId)}</Fragment>;
                  }
                  const key = getColumnKey(col);
                  if (isSnoColumn(col)) {
                    return (
                      <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
                        <span className="admin-text">{globalIdx + 1}</span>
                      </td>
                    );
                  }
                  if (isIdColumn(col)) {
                    return (
                      <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
                        <span className="admin-text">
                          {row.id ?? row[rowIdKey] ?? "-"}
                        </span>
                      </td>
                    );
                  }
                  if (isProfileImageColumn(col)) {
                    const avatar = resolveAvatarFromRecord(row);
                    return (
                      <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
                        <Avatar
                          imageUrl={avatar.imageUrl}
                          firstName={avatar.firstName}
                          lastName={avatar.lastName}
                          size="table"
                          alt={avatar.displayName}
                        />
                      </td>
                    );
                  }
                  if (key === "status" && showStatus && rfq) {
                    const displayStatus = row.statusRaw ?? row.status;
                    return (
                      <td
                        key={col}
                        className={`admin-table-status-col px-4 py-3 align-middle whitespace-nowrap ${statusColumnClass}`}
                      >
                        <RfqStatusBadge status={displayStatus} />
                      </td>
                    );
                  }
                  if (key === "status" && showStatus && effectiveStatusAsText) {
                    return (
                      <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
                        <span className="admin-text">{formatStatusDisplay(row)}</span>
                      </td>
                    );
                  }
                  if (
                    key === "status" &&
                    showStatus &&
                    Array.isArray(statusDropdownOptions) &&
                    statusDropdownOptions.length > 0
                  ) {
                    const currentStatus = String(row.status ?? "").trim();
                    return (
                      <td
                        key={col}
                        className={`admin-table-status-col admin-table-status-col-dropdown px-4 py-3 align-middle ${statusColumnClass}`}
                      >
                        <TableStatusSelect
                          value={currentStatus}
                          options={statusDropdownOptions}
                          disabled={!allowWrite}
                          isDarkMode={isDarkMode}
                          aria-label="Reward request status"
                          onChange={(nextStatus) => {
                            if (nextStatus === currentStatus) return;
                            if (onStatusChange) {
                              onStatusChange(row, nextStatus, globalIdx);
                              return;
                            }
                            setInternalData((prev) =>
                              prev.map((item) => {
                                const matches =
                                  (row.id && item.id === row.id) ||
                                  (row[rowIdKey] && item[rowIdKey] === row[rowIdKey]) ||
                                  item === row;
                                if (!matches) return item;
                                return { ...item, status: nextStatus };
                              })
                            );
                          }}
                        />
                      </td>
                    );
                  }
                  if (key === "status" && showStatus && !effectiveStatusAsText) {
                    return (
                      <td
                        key={col}
                        className={`admin-table-status-col px-3 py-3 align-middle ${statusColumnClass}`}
                      >
                        <StatusToggle
                          checked={String(row.status || "").toLowerCase() === "active"}
                          readOnly={!allowWrite}
                          compact={compactStatusColumn}
                          onChange={
                            allowWrite
                              ? () => {
                                  if (effectiveStatusToggle) {
                                    effectiveStatusToggle(row, globalIdx);
                                    return;
                                  }
                                  setInternalData((prev) =>
                                    prev.map((item) => {
                                      const matches =
                                        (row.id && item.id === row.id) ||
                                        (row[rowIdKey] && item[rowIdKey] === row[rowIdKey]) ||
                                        item === row;
                                      if (!matches) return item;
                                      return {
                                        ...item,
                                        status:
                                          String(item.status).toLowerCase() === "active"
                                            ? "Inactive"
                                            : "Active",
                                      };
                                    })
                                  );
                                }
                              : undefined
                          }
                        />
                      </td>
                    );
                  }
                  if (isDetailsColumn(col)) {
                    return (
                      <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                        <ViewActionButton
                          isDarkMode={isDarkMode}
                          onView={
                            allowRead && onView ? () => onView(row, globalIdx) : undefined
                          }
                        />
                      </td>
                    );
                  }
                  if (isActionColumn(col)) {
                    return (
                      <ModuleListingActionCell
                        key={col}
                        col={col}
                        isDarkMode={isDarkMode}
                        row={row}
                        globalIdx={globalIdx}
                        actionVariant={actionVariant}
                        allowRead={allowRead}
                        allowWrite={allowWrite}
                        readOnlyListingActions={readOnlyListingActions}
                        listingReadMode={listingReadMode}
                        communityUser={communityUser}
                        rfq={rfq}
                        groupSurveyProjects={groupSurveyProjects}
                        userMgmtActions={userMgmtActions}
                        canShowEdit={canShowEdit}
                        canShowDelete={canShowDelete}
                        canShowManagePermissions={canShowManagePermissions}
                        editPath={editPath}
                        showDeleteAction={showDeleteAction}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onManagePermissions={onManagePermissions}
                        onFindUser={onFindUser}
                        onUserSurveyData={onUserSurveyData}
                        onSurveyClone={onSurveyClone}
                        onPdfDownload={onPdfDownload}
                        onApprove={onApprove}
                        onReject={onReject}
                        onAddProject={onAddProject}
                        onListProjects={onListProjects}
                        onAddLog={onAddLog}
                        onViewLogs={onViewLogs}
                        onRewardLog={onRewardLog}
                        onResendEmail={onResendEmail}
                        onDownload={onDownload}
                        surveyActionLabels={surveyActionLabels}
                        handleEdit={handleEdit}
                        handleDeleteRequest={handleDeleteRequest}
                      />
                    );
                  }
                  if (key === "name") {
                    return (
                      <td
                        key={col}
                        className={`px-4 py-3 align-middle ${nowrapAllCells ? "whitespace-nowrap" : ""}`}
                      >
                        {hasProfileImageColumn || nameAsText ? (
                          <span className="admin-text min-w-0 truncate">{row.name || "-"}</span>
                        ) : (
                          <AvatarNameCell record={row} size="table" />
                        )}
                      </td>
                    );
                  }
                  const value = getRowValue(row, col);
                  const displayValue =
                    value === "" || value === "-" ? (key === "projectid" ? "—" : value) : value;
                  if (key === "questionTitle" && onView && allowRead) {
                    const titleText = displayValue === "-" ? "—" : String(displayValue);
                    return (
                      <td
                        key={col}
                        className={`px-4 py-3 align-middle ${
                          nowrapAllCells || isNowrapDataColumn(col) ? "whitespace-nowrap" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onView(row, globalIdx)}
                          className="admin-text text-left hover:opacity-80"
                        >
                          {titleText}
                        </button>
                      </td>
                    );
                  }
                  if (key === "emailSubject") {
                    const subjectText = displayValue === "-" ? "—" : String(displayValue);
                    return (
                      <td
                        key={col}
                        className="max-w-[220px] px-4 py-3 align-middle"
                      >
                        <span
                          className="admin-text block truncate"
                          title={subjectText !== "—" ? subjectText : undefined}
                        >
                          {subjectText}
                        </span>
                      </td>
                    );
                  }
                  if (key === "websiteUrl" || key === "url") {
                    const urlText = displayValue === "-" ? "" : String(displayValue).trim();
                    return (
                      <td
                        key={col}
                        className="max-w-[min(320px,42vw)] px-4 py-3 align-middle"
                      >
                        {urlText && /^https?:\/\//i.test(urlText) ? (
                          <a
                            href={urlText}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="admin-text inline-flex max-w-full items-center gap-1.5 text-[var(--admin-primary-color)] hover:underline"
                            title={urlText}
                          >
                            <span className="min-w-0 truncate">{urlText}</span>
                            <ExternalLink
                              size={14}
                              className="shrink-0 opacity-70"
                              aria-hidden
                            />
                          </a>
                        ) : (
                          <span
                            className="admin-text block truncate"
                            title={urlText || undefined}
                          >
                            {urlText || "—"}
                          </span>
                        )}
                      </td>
                    );
                  }
                  if (isDescriptionColumn(col)) {
                    const rawDescription =
                      displayValue === "-" ? "—" : String(displayValue);
                    const descriptionText = formatDescriptionForLineClamp(
                      rawDescription,
                      descriptionMaxLines
                    );
                    const descriptionClampClass =
                      descriptionMaxLines === 2
                        ? "admin-text admin-table-description-line-clamp-2 break-words"
                        : "admin-text line-clamp-2 whitespace-pre-wrap break-words";
                    return (
                      <td key={col} className="max-w-xl px-4 py-3 align-middle">
                        <span
                          className={descriptionClampClass}
                          title={descriptionText !== "—" ? rawDescription : undefined}
                        >
                          {descriptionText}
                        </span>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col}
                      className={`px-4 py-3 align-middle ${
                        nowrapAllCells || isNowrapDataColumn(col) ? "whitespace-nowrap" : ""
                      }`}
                    >
                      <span className="admin-text">{displayValue}</span>
                    </td>
                  );
                })}
              </tr>
              {isExpanded && renderExpandedContent ? (
                <tr className="admin-table-row align-middle">
                  <td
                    colSpan={tableColumns.length + (hasExpandColumn ? 1 : 0)}
                    className="p-0 align-top"
                  >
                    <div className="admin-table-expanded-panel">
                      {renderExpandedContent(row)}
                    </div>
                  </td>
                </tr>
              ) : null}
              </Fragment>
            );
            })
            )}
          </tbody>
          </table>
      </TableCard>

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
