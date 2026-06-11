import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminPagination from "../../../components/admin/AdminPagination";
import AvatarNameCell from "../../../components/admin/AvatarNameCell";
import Avatar from "../../../components/shared/Avatar";
import { resolveAvatarFromRecord } from "../utils/userAvatar";
import TableLoadingSkeleton from "../../../components/admin/TableLoadingSkeleton";
import GroupSurveyListingActions from "../../../components/admin/GroupSurveyListingActions";
import GroupSurveyProjectListingActions from "../../../components/admin/GroupSurveyProjectListingActions";
import IconActions from "../../../components/admin/IconActions";
import InvoicePdfAction from "../../../components/admin/InvoicePdfAction";
import RewardPendingActions from "../../../components/admin/RewardPendingActions";
import UserManagementActions from "../../../components/admin/UserManagementActions";
import SurveyListingActions from "../../../components/admin/SurveyListingActions";
import RfqListingActions from "../../../components/admin/RfqListingActions";
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
import {
  getColumnKey,
  getRowValue,
  isActionColumn,
  isDetailsColumn,
  isNowrapDataColumn,
  isIdColumn,
  isProfileImageColumn,
  isSnoColumn,
  isStatusColumn,
  TABLE_HEAD_BASE,
  TABLE_STATUS_COL,
} from "../utils/tableHelpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { DEFAULT_PAGE_SIZE, paginateItems } from "../utils/pagination";
import { formatStatusLabel } from "../utils/statusLabels";

function ModuleListingPage({
  isDarkMode,
  title,
  subtitle,
  breadcrumbs,
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
  onView,
  onFindUser,
  onUserSurveyData,
  onSurveyClone,
  onAddProject,
  onListProjects,
  onAddLog,
  onViewLogs,
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
  /** API total record count (used for pagination summary when not searching). */
  totalRecords = null,
  /** When true, rows are already paginated by the API; parent controls page + page size. */
  serverPaginated = false,
  paginationPage = 1,
  onPaginationPageChange,
  paginationPageSize,
  onPaginationPageSizeChange,
  /** When true, Name column shows plain text instead of avatar + name. */
  nameAsText = false,
  /** When set, prepends an expand column and renders content below expanded rows. */
  renderExpandedContent = null,
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
  const currentPage = serverPaginated ? paginationPage : internalCurrentPage;
  const pageSize = serverPaginated ? (paginationPageSize ?? initialPageSize) : internalPageSize;
  const [internalData, setInternalData] = useState(rows);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState(() => new Set());
  const hasExpandColumn = Boolean(renderExpandedContent);

  const hasActionColumn = columns.some(isActionColumn);
  const isExternallyManaged = Boolean(
    onStatusToggle ||
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
    !viewEdit &&
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

  const rowsSignature = rows.map((row) => row[rowIdKey] ?? row.id ?? "").join(",");
  const [prevRowsSignature, setPrevRowsSignature] = useState(rowsSignature);
  if (!isExternallyManaged && rowsSignature !== prevRowsSignature) {
    setPrevRowsSignature(rowsSignature);
    setInternalData(rows);
  }

  const data = isExternallyManaged ? rows : internalData;

  const handlePageChange = useCallback(
    (nextPage) => {
      if (serverPaginated) {
        onPaginationPageChange?.(nextPage);
        return;
      }
      setInternalCurrentPage(nextPage);
    },
    [serverPaginated, onPaginationPageChange]
  );

  const handlePageSizeChange = useCallback(
    (nextSize) => {
      if (serverPaginated) {
        onPaginationPageSizeChange?.(nextSize);
        return;
      }
      setInternalPageSize(nextSize);
      setInternalCurrentPage(1);
    },
    [serverPaginated, onPaginationPageSizeChange]
  );

  const handleQueryChange = (value) => {
    setQuery(value);
    if (!serverPaginated) {
      setInternalCurrentPage(1);
    }
  };

  const normalizedQuery = debouncedQuery.trim().toLowerCase();

  const filtered = data.filter((row) => {
    if (!normalizedQuery) return true;
    if (searchFields?.length) {
      return searchFields.some((field) =>
        String(row[field] ?? "")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    }
    return Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const paginationTotalItems = normalizedQuery
    ? filtered.length
    : totalRecords ?? filtered.length;

  const pagination = useMemo(() => {
    if (serverPaginated && !normalizedQuery) {
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
    serverPaginated,
    normalizedQuery,
  ]);

  useEffect(() => {
    if (serverPaginated) return;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
    setInternalCurrentPage((prev) => Math.min(prev, pages));
  }, [filtered.length, pageSize, debouncedQuery, serverPaginated]);

  const hasProfileImageColumn = columns.some(isProfileImageColumn);

  const paginationFooter =
    showPagination &&
    !isLoading &&
    (filtered.length > 0 || (serverPaginated && (totalRecords ?? 0) > 0)) ? (
      <AdminPagination
        isDarkMode={isDarkMode}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        visibleItemCount={
          totalRecords != null && !normalizedQuery
            ? serverPaginated
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
    let cols = filterColumns(columns);
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
      hasActionColumn,
    });
    if (!showActionColumn && hasActionColumn) {
      cols = cols.filter((col) => !isActionColumn(col));
    }
    return cols;
  }, [
    columns,
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
    hasActionColumn,
  ]);

  const formatStatusDisplay = (row) =>
    formatStatusLabel(row.statusLabel ?? row.status);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        isDarkMode={isDarkMode}
      />
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <DebouncedSearchInput
          value={query}
          onChange={handleQueryChange}
          onDebouncedChange={onSearch}
          placeholder={searchPlaceholder}
          isDarkMode={isDarkMode}
        />
        {(showSecondaryAction || showAddButton) && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5">
            {showSecondaryAction && (
              <button
                type="button"
                onClick={onSecondaryActionClick}
                className="admin-btn-cancel h-10 rounded-xl px-4 text-sm font-semibold transition hover:opacity-90"
              >
                {secondaryActionLabel}
              </button>
            )}
            {showAddButton && (
              <button
                type="button"
                onClick={onActionClick}
                className="h-10 shrink-0 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49]"
              >
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </div>

      <TableCard isDarkMode={isDarkMode} footer={paginationFooter}>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-sm">
          <thead>
            <tr className="admin-text-muted">
              {hasExpandColumn && (
                <th className={`${TABLE_HEAD_BASE} w-12 text-left`} aria-label="Expand row">
                  <span className="sr-only">Expand</span>
                </th>
              )}
              {displayColumns.map((h) => (
                <th
                  key={h}
                  className={`${TABLE_HEAD_BASE} ${
                    isStatusColumn(h) ? `admin-table-status-col ${TABLE_STATUS_COL}` : ""
                  } ${isActionColumn(h) ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableLoadingSkeleton
                columns={hasExpandColumn ? ["", ...displayColumns] : displayColumns}
              />
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={displayColumns.length}
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
              return (
              <Fragment key={rowKey}>
              <tr
                className={`border-t align-middle ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}
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
                {displayColumns.map((col) => {
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
                        <span className="admin-text">{row.id ?? "-"}</span>
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
                  if (key === "status" && showStatus && effectiveStatusAsText) {
                    return (
                      <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
                        <span className="admin-text">{formatStatusDisplay(row)}</span>
                      </td>
                    );
                  }
                  if (key === "status" && showStatus && !effectiveStatusAsText) {
                    return (
                      <td key={col} className={`admin-table-status-col px-4 py-3 align-middle ${TABLE_STATUS_COL}`}>
                        <StatusToggle
                          checked={String(row.status || "").toLowerCase() === "active"}
                          readOnly={!allowWrite}
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
                    if (!allowRead) return null;

                    if (!allowWrite && !readOnlyListingActions) {
                      return null;
                    }
                    if (actionVariant === "user-management") {
                      const { showEdit, showDelete } =
                        userMgmtActions ?? getUserManagementActionFlags({
                          allowWrite,
                          onEdit,
                          editPath,
                          onDelete,
                          showDeleteAction,
                        });

                      if (!showEdit && !showDelete) {
                        return null;
                      }

                      return (
                        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <UserManagementActions
                            isDarkMode={isDarkMode}
                            showManagePermissions={canShowManagePermissions}
                            showEdit={showEdit}
                            showDelete={showDelete}
                            onManagePermissions={
                              onManagePermissions
                                ? () => onManagePermissions(row, globalIdx)
                                : undefined
                            }
                            onEdit={
                              showEdit
                                ? () => handleEdit(row, globalIdx)
                                : undefined
                            }
                            onDelete={
                              showDelete
                                ? () => handleDeleteRequest(row, globalIdx)
                                : undefined
                            }
                          />
                        </td>
                      );
                    }
                    if (rfq) {
                      const hasRfqActions =
                        (allowWrite && (editPath || onDelete || onAddLog)) ||
                        (allowRead && onViewLogs);

                      if (!hasRfqActions) {
                        return null;
                      }

                      return (
                        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <RfqListingActions
                            isDarkMode={isDarkMode}
                            onEdit={
                              canShowEdit
                                ? () => handleEdit(row, globalIdx)
                                : undefined
                            }
                            onDelete={
                              canShowDelete
                                ? () => handleDeleteRequest(row, globalIdx)
                                : undefined
                            }
                            onAddLog={
                              allowWrite && onAddLog
                                ? () => onAddLog(row, globalIdx)
                                : undefined
                            }
                            onViewLogs={
                              allowRead && onViewLogs
                                ? () => onViewLogs(row, globalIdx)
                                : undefined
                            }
                          />
                        </td>
                      );
                    }
                    if (groupSurveyProjects) {
                      return (
                        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <GroupSurveyProjectListingActions
                            isDarkMode={isDarkMode}
                            onEdit={
                              allowWrite && canShowEdit
                                ? () => handleEdit(row, globalIdx)
                                : undefined
                            }
                            onAddProject={
                              allowWrite && onAddProject
                                ? () => onAddProject(row, globalIdx)
                                : undefined
                            }
                            onDelete={
                              canShowDelete
                                ? () => handleDeleteRequest(row, globalIdx)
                                : undefined
                            }
                          />
                        </td>
                      );
                    }
                    if (actionVariant === "group-survey") {
                      const readOnlyGroupSurvey =
                        !allowWrite && listingReadMode === "group-survey-view";
                      return (
                        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <GroupSurveyListingActions
                            isDarkMode={isDarkMode}
                            onEdit={
                              !readOnlyGroupSurvey && canShowEdit
                                ? () => handleEdit(row, globalIdx)
                                : undefined
                            }
                            onAddProject={
                              !readOnlyGroupSurvey && canShowEdit && onAddProject
                                ? () => onAddProject(row, globalIdx)
                                : undefined
                            }
                            onListProjects={
                              allowRead && onListProjects
                                ? () => onListProjects(row, globalIdx)
                                : undefined
                            }
                          />
                        </td>
                      );
                    }
                    if (actionVariant === "view-edit") {
                      const useSurveyActions =
                        onFindUser || onUserSurveyData || onSurveyClone;

                      if (!useSurveyActions && !allowWrite) {
                        return null;
                      }

                      return (
                        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          {useSurveyActions ? (
                            <SurveyListingActions
                              isDarkMode={isDarkMode}
                              onView={
                                allowRead && onView ? () => onView(row, globalIdx) : undefined
                              }
                              onEdit={
                                canShowEdit
                                  ? () => handleEdit(row, globalIdx)
                                  : undefined
                              }
                              onFindUser={
                                allowRead && onFindUser
                                  ? () => onFindUser(row, globalIdx)
                                  : undefined
                              }
                              onUserSurveyData={
                                allowRead && onUserSurveyData
                                  ? () => onUserSurveyData(row, globalIdx)
                                  : undefined
                              }
                              onSurveyClone={
                                allowWrite && onSurveyClone
                                  ? () => onSurveyClone(row, globalIdx)
                                  : undefined
                              }
                              labels={surveyActionLabels}
                            />
                          ) : (
                            <IconActions
                              isDarkMode={isDarkMode}
                              showDelete={canShowDelete}
                              onEdit={
                                canShowEdit
                                  ? () => handleEdit(row, globalIdx)
                                  : undefined
                              }
                              onDelete={
                                canShowDelete
                                  ? () => handleDeleteRequest(row, globalIdx)
                                  : undefined
                              }
                            />
                          )}
                        </td>
                      );
                    }
                    if (actionVariant === "pdf-download") {
                      return (
                        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <InvoicePdfAction
                            isDarkMode={isDarkMode}
                            onDownload={
                              allowRead && onPdfDownload
                                ? () => onPdfDownload(row, globalIdx)
                                : undefined
                            }
                          />
                        </td>
                      );
                    }
                    if (actionVariant === "reward-pending") {
                      return (
                        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <RewardPendingActions
                            isDarkMode={isDarkMode}
                            onView={
                              allowRead && onView ? () => onView(row, globalIdx) : undefined
                            }
                            onApprove={
                              allowWrite && onApprove
                                ? () => onApprove(row, globalIdx)
                                : undefined
                            }
                            onReject={
                              allowWrite && onReject
                                ? () => onReject(row, globalIdx)
                                : undefined
                            }
                          />
                        </td>
                      );
                    }
                    if (!allowWrite) {
                      return null;
                    }

                    return (
                      <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                        <IconActions
                          isDarkMode={isDarkMode}
                          showDelete={canShowDelete}
                          onEdit={
                            canShowEdit
                              ? () => handleEdit(row, globalIdx)
                              : undefined
                          }
                          onDelete={
                            canShowDelete
                              ? () => handleDeleteRequest(row, globalIdx)
                              : undefined
                          }
                        />
                      </td>
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
                <tr
                  className={`border-t align-middle ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}
                >
                  <td
                    colSpan={displayColumns.length + 1}
                    className="bg-[var(--admin-permissions-table-head-bg)] px-4 py-4"
                  >
                    {renderExpandedContent(row)}
                  </td>
                </tr>
              ) : null}
              </Fragment>
            );
            })
            )}
          </tbody>
          </table>
        </div>
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
