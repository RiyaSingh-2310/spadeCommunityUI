import { useState } from "react";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import TableCard from "../../../components/admin/TableCard";
import AdminPagination from "../../../components/admin/AdminPagination";
import { getRecords } from "../../../services/activity/activityApi";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";

const TABLE_COLUMNS = ["S.No", "Name", "Email", "Description", "Log Date"];

function AuditLogSettingsTab({ isDarkMode }) {
  const [query, setQuery] = useState("");

  const {
    rows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize) || 1);
  const safePage = Math.min(currentPage, totalPages);

  return (
    <div className="space-y-5">
      <DebouncedSearchInput
        value={query}
        onChange={setQuery}
        onDebouncedChange={handleSearch}
        placeholder="Search logs..."
        isDarkMode={isDarkMode}
        maxWidthClass="w-full sm:max-w-[340px]"
      />

      <TableCard
        isDarkMode={isDarkMode}
        footer={
          totalRecords > 0 ? (
            <AdminPagination
              isDarkMode={isDarkMode}
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={totalRecords}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : null
        }
      >
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-sm">
            <thead>
              <tr className="admin-text-muted">
                {TABLE_COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="border-t border-[var(--admin-header-surface-border)]">
                  <td
                    colSpan={TABLE_COLUMNS.length}
                    className="admin-text-muted px-4 py-8 text-center text-sm"
                  >
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr className="border-t border-[var(--admin-header-surface-border)]">
                  <td
                    colSpan={TABLE_COLUMNS.length}
                    className="admin-text-muted px-4 py-8 text-center text-sm"
                  >
                    No audit logs found
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const serialNo = (safePage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={row.id}
                      className="border-t border-[var(--admin-header-surface-border)]"
                    >
                      <td className="admin-text whitespace-nowrap px-4 py-3">
                        {serialNo}
                      </td>
                      <td className="admin-text whitespace-nowrap px-4 py-3">
                        {row.name}
                      </td>
                      <td className="admin-text whitespace-nowrap px-4 py-3">
                        {row.email}
                      </td>
                      <td className="admin-text max-w-md px-4 py-3 whitespace-normal break-words">
                        {row.description}
                      </td>
                      <td className="admin-text-muted whitespace-nowrap px-4 py-3">
                        {row.createdAt}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  );
}

export default AuditLogSettingsTab;
