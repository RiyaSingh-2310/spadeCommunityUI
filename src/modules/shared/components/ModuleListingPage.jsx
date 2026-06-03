import { useMemo, useState } from "react";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminPagination from "../../../components/admin/AdminPagination";
import AvatarNameCell from "../../../components/admin/AvatarNameCell";
import ProfileAvatar from "../../../components/shared/ProfileAvatar";
import TableLoadingSkeleton from "../../../components/admin/TableLoadingSkeleton";
import IconActions from "../../../components/admin/IconActions";
import RewardPendingActions from "../../../components/admin/RewardPendingActions";
import StatusToggle from "../../../components/admin/StatusToggle";
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
  nowrapAllCells = false,
  rowIdKey = "id",
  onEdit,
  onDelete,
  onSearch,
  onStatusToggle,
  onView,
  onApprove,
  onReject,
  isLoading = false,
  loadingMessage = "Loading...",
  emptyMessage = "No records found",
  searchFields = null,
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [currentPage, setCurrentPage] = useState(1);
  const [internalData, setInternalData] = useState(rows);
  const isExternallyManaged = Boolean(onStatusToggle || onEdit || onDelete);
  const editOnly = actionVariant === "edit-only";

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

  const hasProfileImageColumn = columns.some(isProfileImageColumn);

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
        {onActionClick && (
          <button
            type="button"
            onClick={onActionClick}
            className="h-10 shrink-0 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49]"
          >
            {actionLabel}
          </button>
        )}
      </div>

      <TableCard isDarkMode={isDarkMode}>
        {isLoading && (
          <p className="admin-text-muted mb-3 px-1 text-sm">{loadingMessage}</p>
        )}
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-sm">
          <thead>
            <tr className="admin-text-muted">
              {columns.map((h) => (
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
                columns={columns}
                isDarkMode={isDarkMode}
              />
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
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
                {columns.map((col) => {
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
                    return (
                      <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
                        <ProfileAvatar
                          imageUrl={row.imageUrl ?? row.image}
                          firstName={row.firstName}
                          lastName={row.lastName}
                          size="xs"
                          alt={row.name}
                        />
                      </td>
                    );
                  }
                  if (key === "status" && showStatus && statusAsText) {
                    return (
                      <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
                        <span className="admin-text">
                          {row.statusLabel ?? row.status ?? "-"}
                        </span>
                      </td>
                    );
                  }
                  if (key === "status" && showStatus) {
                    return (
                      <td key={col} className={`admin-table-status-col px-4 py-3 align-middle ${TABLE_STATUS_COL}`}>
                        <StatusToggle
                          checked={String(row.status || "").toLowerCase() === "active"}
                          onChange={() => {
                            if (onStatusToggle) {
                              onStatusToggle(row, globalIdx);
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
                          onView={onView ? () => onView(row, globalIdx) : undefined}
                        />
                      </td>
                    );
                  }
                  if (isActionColumn(col)) {
                    if (actionVariant === "reward-pending") {
                      return (
                        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <RewardPendingActions
                            isDarkMode={isDarkMode}
                            onView={onView ? () => onView(row, globalIdx) : undefined}
                            onApprove={onApprove ? () => onApprove(row, globalIdx) : undefined}
                            onReject={onReject ? () => onReject(row, globalIdx) : undefined}
                          />
                        </td>
                      );
                    }
                    return (
                      <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
                        <IconActions
                          isDarkMode={isDarkMode}
                          showDelete={showDeleteAction && !editOnly}
                          onEdit={onEdit ? () => onEdit(row, globalIdx) : undefined}
                          onDelete={onDelete ? () => onDelete(row, globalIdx) : undefined}
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
                          <AvatarNameCell
                            name={row.name}
                            image={row.image || row.avatar}
                            imageUrl={row.imageUrl ?? row.image}
                            firstName={row.firstName}
                            lastName={row.lastName}
                          />
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
        {!isLoading && filtered.length > 0 && (
          <AdminPagination
            isDarkMode={isDarkMode}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </TableCard>
    </div>
  );
}

export default ModuleListingPage;
