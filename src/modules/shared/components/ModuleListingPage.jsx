import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminPagination from "../../../components/admin/AdminPagination";
import AvatarNameCell from "../../../components/admin/AvatarNameCell";
import Avatar from "../../../components/shared/Avatar";
import { resolveAvatarFromRecord } from "../utils/userAvatar";
import TableLoadingSkeleton from "../../../components/admin/TableLoadingSkeleton";
import IconActions from "../../../components/admin/IconActions";
import InvoicePdfAction from "../../../components/admin/InvoicePdfAction";
import RewardPendingActions from "../../../components/admin/RewardPendingActions";
import UserManagementActions from "../../../components/admin/UserManagementActions";
import ViewEditActions from "../../../components/admin/ViewEditActions";
import StatusToggle from "../../../components/admin/StatusToggle";
import { useModulePermission } from "../../permissions/useModulePermission";
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
  columns = [],
  rows = [],
  showStatus = true,
  statusAsText = false,
  actionVariant = "edit-delete",
  showDeleteAction = true,
  pageSize = DEFAULT_PAGE_SIZE,
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
  onApprove,
  onReject,
  onPdfDownload,
  onManagePermissions,
  /** Permission module key, e.g. "clients" — gates add/edit/delete/status */
  permissionModule = null,
  isLoading = false,
  loadingMessage = "Loading...",
  emptyMessage = "No records found",
  searchFields = null,
}) {
  const navigate = useNavigate();
  const {
    canRead: allowRead,
    canWrite: allowWrite,
    filterColumns,
  } = useModulePermission(permissionModule);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [currentPage, setCurrentPage] = useState(1);
  const [internalData, setInternalData] = useState(rows);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasActionColumn = columns.some(isActionColumn);
  const isExternallyManaged = Boolean(
    onStatusToggle || onEdit || onDelete || onManagePermissions
  );
  const editOnly = actionVariant === "edit-only";
  const viewEdit = actionVariant === "view-edit";
  const pdfDownload = actionVariant === "pdf-download";
  const userManagement = actionVariant === "user-management";

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

  const canShowEdit = allowWrite && Boolean(onEdit || editPath);
  const canShowDelete =
    allowWrite &&
    showDeleteAction &&
    !editOnly &&
    !viewEdit &&
    !pdfDownload &&
    !userManagement &&
    Boolean(onDelete || hasActionColumn);
  const canShowManagePermissions =
    allowWrite && userManagement && Boolean(onManagePermissions);
  const effectiveStatusToggle = allowWrite ? onStatusToggle : undefined;
  const effectiveStatusAsText = statusAsText || (showStatus && !allowWrite);
  const showAddButton = Boolean(onActionClick && allowWrite);

  const rowsSignature = rows.map((row) => row[rowIdKey] ?? row.id ?? "").join(",");
  const [prevRowsSignature, setPrevRowsSignature] = useState(rowsSignature);
  if (!isExternallyManaged && rowsSignature !== prevRowsSignature) {
    setPrevRowsSignature(rowsSignature);
    setInternalData(rows);
  }

  const data = isExternallyManaged ? rows : internalData;

  const handleQueryChange = (value) => {
    setQuery(value);
    setCurrentPage(1);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const safePage = Math.min(currentPage, totalPages);

  const pagination = useMemo(
    () => paginateItems(filtered, safePage, pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
    setCurrentPage((prev) => Math.min(prev, pages));
  }, [filtered.length, pageSize, debouncedQuery]);

  const hasProfileImageColumn = columns.some(isProfileImageColumn);

  const paginationFooter =
    showPagination && !isLoading && filtered.length > 0 ? (
      <AdminPagination
        isDarkMode={isDarkMode}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    ) : null;

  const displayColumns = useMemo(
    () => filterColumns(columns),
    [columns, filterColumns]
  );

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

      <TableCard isDarkMode={isDarkMode} footer={paginationFooter}>
        {isLoading && (
          <p className="admin-text-muted mb-3 px-1 text-sm">{loadingMessage}</p>
        )}
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-sm">
          <thead>
            <tr className="admin-text-muted">
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
                columns={displayColumns}
                isDarkMode={isDarkMode}
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
              return (
              <tr
                key={row[rowIdKey] || row.id || row.name || idx}
                className={`border-t align-middle ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}
              >
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
                          onChange={() => {
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
                          }}
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
                    if (!allowWrite) return null;
                    if (actionVariant === "user-management") {
                      return (
                        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <UserManagementActions
                            isDarkMode={isDarkMode}
                            showManagePermissions={canShowManagePermissions}
                            showEdit={canShowEdit}
                            showDelete={canShowDelete}
                            onManagePermissions={
                              onManagePermissions
                                ? () => onManagePermissions(row, globalIdx)
                                : undefined
                            }
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
                    if (actionVariant === "view-edit") {
                      return (
                        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <ViewEditActions
                            isDarkMode={isDarkMode}
                            onView={
                              allowRead && onView ? () => onView(row, globalIdx) : undefined
                            }
                            onEdit={
                              canShowEdit
                                ? () => handleEdit(row, globalIdx)
                                : undefined
                            }
                          />
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
                              onApprove ? () => onApprove(row, globalIdx) : undefined
                            }
                            onReject={
                              onReject ? () => onReject(row, globalIdx) : undefined
                            }
                          />
                        </td>
                      );
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
                        {hasProfileImageColumn ? (
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
