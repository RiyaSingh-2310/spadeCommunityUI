import { useCallback, useState } from "react";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { formatSurveyListDate } from "../../shared/utils/dateTime";
import RewardDetailsModal from "../components/RewardDetailsModal";
import { fetchRedeemRequests } from "../services/rewardHistoryApi";

function CompletedRewardsPage({ isDarkMode }) {
  const [viewTarget, setViewTarget] = useState(null);

  const fetchCompleted = useCallback(async (params) => {
    // Completed = approved + rejected. Fetch approved page; include rejected via a second call.
    const approved = await fetchRedeemRequests({ ...params, status: "approved" });
    const rejected = await fetchRedeemRequests({
      page: 1,
      limit: params.limit || DEFAULT_PAGE_SIZE,
      search: params.search,
      status: "rejected",
    });

    const merged = [...(approved.items ?? []), ...(rejected.items ?? [])].sort((a, b) => {
      const aTime = new Date(a.updatedAtRaw || a.actionDateRaw || a.createdAtRaw || 0).getTime();
      const bTime = new Date(b.updatedAtRaw || b.actionDateRaw || b.createdAtRaw || 0).getTime();
      return bTime - aTime;
    });

    return {
      items: merged,
      total: (approved.total ?? 0) + (rejected.total ?? 0),
      page: approved.page,
      limit: approved.limit,
      totalPages: Math.max(approved.totalPages ?? 1, 1),
    };
  }, []);

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
    refresh,
  } = useApiListing({
    fetchFn: fetchCompleted,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });

  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: "User Name",
  });

  return (
    <>
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Completed Rewards"
        searchPlaceholder="Search completed rewards..."
        columns={[
          "S.No",
          "User Name",
          "Remark",
          "Reward Points",
          "Status",
          "Created Date",
          "Completed Date",
          "Action",
        ]}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="id"
        showStatus
        statusAsText
        permissionModule="completed_rewards"
        actionVariant="reward-pending"
        isLoading={isLoading}
        errorMessage={listError}
        onRetry={refresh}
        emptyMessage="No completed rewards found"
        onSearch={handleSearch}
        showPagination
        serverPaginated
        serverSearch
        totalRecords={totalRecords}
        paginationTotalPages={totalPages}
        paginationPage={currentPage}
        onPaginationPageChange={handlePageChange}
        paginationPageSize={pageSize}
        onPaginationPageSizeChange={handlePageSizeChange}
        onView={(row) => setViewTarget(row)}
      />

      <RewardDetailsModal
        isOpen={Boolean(viewTarget)}
        mode="view"
        row={
          viewTarget
            ? {
                ...viewTarget,
                createdDate: formatSurveyListDate(
                  viewTarget.createdAtRaw ?? viewTarget.createdAt ?? viewTarget.createdDate
                ),
                updatedDate: formatSurveyListDate(
                  viewTarget.updatedAtRaw ?? viewTarget.updatedAt
                ),
                completedDate:
                  viewTarget.completedDate ||
                  formatSurveyListDate(viewTarget.actionDateRaw || viewTarget.updatedAtRaw),
                remark: viewTarget.remark || viewTarget.comments || "",
              }
            : null
        }
        onCancel={() => setViewTarget(null)}
      />
    </>
  );
}

export default CompletedRewardsPage;
