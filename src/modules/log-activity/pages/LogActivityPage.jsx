import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminPagination from "../../../components/admin/AdminPagination";
import TableCard from "../../../components/admin/TableCard";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { DEFAULT_PAGE_SIZE, paginateItems } from "../../shared/utils/pagination";

const initialRows = Array.from({ length: 14 }).map((_, idx) => ({
  id: `log-${idx + 1}`,
  name: ["John Doe", "Ava Brown", "Liam Jones", "Priya Desai", "Marcus Johnson"][idx % 5],
  logDate: `${String(2 + (idx % 3)).padStart(2, "0")}/06/2026 ${9 + (idx % 4)}:${15 + idx} AM`,
}));

function LogActivityPage({ isDarkMode }) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [currentPage, setCurrentPage] = useState(1);

  const handleQueryChange = (value) => {
    setQuery(value);
    setCurrentPage(1);
  };

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        Object.values(row).join(" ").toLowerCase().includes(debouncedQuery.toLowerCase())
      ),
    [rows, debouncedQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / DEFAULT_PAGE_SIZE) || 1);
  const safePage = Math.min(currentPage, totalPages);
  const pagination = paginateItems(filtered, safePage, DEFAULT_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Log Activity"
        subtitle="Track user actions and activity logs."
        isDarkMode={isDarkMode}
      />
      <DebouncedSearchInput
        value={query}
        onChange={handleQueryChange}
        placeholder="Search log activity..."
        isDarkMode={isDarkMode}
      />
      <TableCard isDarkMode={isDarkMode}>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-sm">
            <thead>
              <tr className="admin-text-muted">
                {["S.No", "Name", "Log Date", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagination.items.map((row, idx) => {
                const globalIdx = (pagination.currentPage - 1) * DEFAULT_PAGE_SIZE + idx;
                return (
                  <tr
                    key={row.id}
                    className={`border-t ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}
                  >
                    <td className="admin-text whitespace-nowrap px-4 py-3">{globalIdx + 1}</td>
                    <td className="admin-text whitespace-nowrap px-4 py-3">{row.name}</td>
                    <td className="admin-text whitespace-nowrap px-4 py-3">{row.logDate}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setRows((prev) => prev.filter((item) => item.id !== row.id))}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--admin-danger-text)] transition-colors hover:bg-[var(--admin-danger-text)]/10"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <AdminPagination
          isDarkMode={isDarkMode}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      </TableCard>
    </div>
  );
}

export default LogActivityPage;
