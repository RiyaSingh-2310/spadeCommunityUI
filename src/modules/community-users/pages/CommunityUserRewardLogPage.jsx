import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import TableCard from "../../../components/admin/TableCard";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import RewardLogFilterPanel from "../components/RewardLogFilterPanel";
import { getRecord, getUserRewardLogs } from "../services/communityUsersApi";

const LIST_COLUMNS = ["ID", "Reward Points", "Reason", "Date"];

const DEFAULT_FILTERS = {
  reason: "all",
  pointsType: "all",
};

function CommunityUserRewardLogPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [userError, setUserError] = useState("");
  const [userLoading, setUserLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    getRecord(id)
      .then((record) => {
        if (cancelled) return;
        setUser(record);
        setUserError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setUser(null);
        setUserError(error?.message || "Unable to load panelist.");
      })
      .finally(() => {
        if (!cancelled) setUserLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(
    async (params) => getUserRewardLogs(id, { ...params, filters: appliedFilters }),
    [id, appliedFilters]
  );

  const {
    rows,
    totalRecords,
    isLoading,
    listError,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
  } = useApiListing({
    fetchFn: fetchLogs,
    initialPageSize: DEFAULT_PAGE_SIZE,
    enabled: Boolean(id) && !userLoading && Boolean(user),
  });

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setShowFilters(true);
    handlePageChange(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    handlePageChange(1);
  };

  const filterToolbar = useMemo(
    () => (
      <button
        type="button"
        onClick={() => setShowFilters((prev) => !prev)}
        className="admin-btn-cancel inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition hover:opacity-90"
      >
        <SlidersHorizontal size={15} />
        Filter
      </button>
    ),
    []
  );

  if (!userLoading && !user) {
    return (
      <div className="space-y-6">
        <ModuleListingPage
          isDarkMode={isDarkMode}
          title="List Reward Logs"
          columns={LIST_COLUMNS}
          rows={[]}
          showStatus={false}
          emptyMessage={userError || "User not found."}
        />
        <button
          type="button"
          onClick={() => navigate("/community-users")}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white"
        >
          Back to Panelists
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="List Reward Logs"
        breadcrumbs={[
          { label: "Panelist", to: "/community-users" },
          { label: "List Reward Logs" },
        ]}
        searchPlaceholder="Search reward logs..."
        columns={LIST_COLUMNS}
        rows={rows}
        rowIdKey="id"
        permissionModule="community_users"
        showStatus={false}
        isLoading={isLoading}
        errorMessage={listError}
        onRetry={refresh}
        emptyMessage="No reward log entries found."
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
        toolbarEnd={filterToolbar}
      />

      {showFilters && (
        <TableCard title="Filters" isDarkMode={isDarkMode}>
          <div className="space-y-4">
            <RewardLogFilterPanel filters={filters} onChange={setFilters} />
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="h-10 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white transition hover:bg-[#0f9b49]"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="admin-btn-cancel h-10 rounded-xl px-4 text-sm font-semibold transition hover:opacity-90"
              >
                Reset
              </button>
            </div>
          </div>
        </TableCard>
      )}
    </div>
  );
}

export default CommunityUserRewardLogPage;
