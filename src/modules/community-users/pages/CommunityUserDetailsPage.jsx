import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import AdminPagination from "../../../components/admin/AdminPagination";
import TableCard from "../../../components/admin/TableCard";
import TableLoadingSkeleton from "../../../components/admin/TableLoadingSkeleton";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { getCommunityUserById } from "../data/communityUsersStore";
import { getUserProfilingAnswers } from "../services/communityUsersApi";

const TABLE_HEAD =
  "admin-text-muted px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

function CommunityUserDetailsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = id ? getCommunityUserById(id) : null;
  const [query, setQuery] = useState("");

  const fetchAnswers = useCallback(
    async (params) => getUserProfilingAnswers(id, params),
    [id]
  );

  const {
    rows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  } = useApiListing({
    fetchFn: fetchAnswers,
    initialPageSize: DEFAULT_PAGE_SIZE,
    enabled: Boolean(user),
  });

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize) || 1);
  const safePage = Math.min(currentPage, totalPages);

  if (!user) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="User Details" isDarkMode={isDarkMode} />
        <p className="admin-text-muted text-sm">User not found.</p>
        <button
          type="button"
          onClick={() => navigate("/community-users")}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white"
        >
          Back to Users
        </button>
      </div>
    );
  }

  const paginationFooter =
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
    ) : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Details"
        breadcrumbs={[
          { label: "Users", to: "/community-users" },
          { label: "User List", to: "/community-users" },
          { label: "User Details" },
        ]}
        isDarkMode={isDarkMode}
      />

      <div className="admin-text space-y-1">
        <p className="text-lg font-semibold">{user.name}</p>
        <p className="admin-text-muted text-sm">{user.emailAddress}</p>
      </div>

      <DebouncedSearchInput
        value={query}
        onChange={setQuery}
        onDebouncedChange={handleSearch}
        placeholder="Search questions or answers..."
        isDarkMode={isDarkMode}
      />

      <TableCard isDarkMode={isDarkMode} footer={paginationFooter}>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-sm">
            <thead>
              <tr>
                {["Question", "Answer Opted"].map((column) => (
                  <th key={column} className={TABLE_HEAD}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableLoadingSkeleton columns={["Question", "Answer Opted"]} />
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="admin-text-muted px-4 py-16 text-center text-sm"
                  >
                    No profiling answers found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t align-middle ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}
                  >
                    <td className="admin-text px-4 py-3 align-middle">{row.question}</td>
                    <td className="admin-text px-4 py-3 align-middle">{row.answerOpted}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  );
}

export default CommunityUserDetailsPage;
