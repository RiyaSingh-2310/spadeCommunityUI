import { useCallback, useState } from "react";
import AdminDateRangeFilter from "../../../components/admin/AdminDateRangeFilter";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import RewardDetailsModal from "../components/RewardDetailsModal";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { formatSurveyListDate } from "../../shared/utils/dateTime";
import { fetchRewardTransactions } from "../services/rewardTransactionsApi";

function RewardHistoryPage({ isDarkMode }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewTarget, setViewTarget] = useState(null);

  const fetchRewardHistory = useCallback(
    async (params) => {
      const data = await fetchRewardTransactions({
        ...params,
        start_date: fromDate || undefined,
        end_date: toDate || undefined,
      });
      return {
        items: data.rows,
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      };
    },
    [fromDate, toDate]
  );

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
    refresh: reloadRewardHistory,
  } = useApiListing({
    fetchFn: fetchRewardHistory,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });

  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: "User Name",
  });

  const handleFromDateChange = (value) => {
    setFromDate(value);
    handlePageChange(1);
  };

  const handleToDateChange = (value) => {
    setToDate(value);
    handlePageChange(1);
  };

  const handleView = (row) => {
    if (row?.id == null) return;
    setViewTarget(row);
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Reward History"
        searchPlaceholder="Search reward history..."
        columns={[
          "ID",
          "User Name",
          "Remark",
          "Credit",
          "Debit",
          "Balance",
          "Status",
          "Created At",
          "Action",
        ]}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        isLoading={isLoading}
        errorMessage={listError}
        onRetry={reloadRewardHistory}
        emptyMessage="No reward history found"
        rowIdKey="id"
        showStatus
        statusAsText
        permissionModule="reward_history"
        actionVariant="reward-pending"
        onSearch={handleSearch}
        serverSearch
        showPagination
        serverPaginated
        totalRecords={totalRecords}
        paginationTotalPages={totalPages}
        paginationPage={currentPage}
        paginationPageSize={pageSize}
        onPaginationPageChange={handlePageChange}
        onPaginationPageSizeChange={handlePageSizeChange}
        onView={handleView}
        toolbarEnd={
          <AdminDateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromChange={handleFromDateChange}
            onToChange={handleToDateChange}
          />
        }
      />

      <RewardDetailsModal
        isOpen={Boolean(viewTarget)}
        mode="view"
        row={
          viewTarget
            ? {
                ...viewTarget,
                rewardPoints: viewTarget.rewardPoints,
                createdDate: formatSurveyListDate(
                  viewTarget.createdAtRaw ?? viewTarget.createdAt
                ),
                updatedDate: formatSurveyListDate(
                  viewTarget.updatedAtRaw ?? viewTarget.updatedAt
                ),
                remark: viewTarget.remark || viewTarget.comments || "",
              }
            : null
        }
        onCancel={() => setViewTarget(null)}
      />
    </div>
  );
}

export default RewardHistoryPage;
