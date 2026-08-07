import { useEffect, useMemo, useState } from "react";
import AdminDateRangeFilter from "../../../components/admin/AdminDateRangeFilter";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import RewardDetailsModal from "../components/RewardDetailsModal";
import { formatSurveyListDate } from "../../shared/utils/dateTime";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { toastApiError } from "../../../services/toast/apiToast";
import { fetchRewardTransactions } from "../services/rewardTransactionsApi";

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function RewardHistoryPage({ isDarkMode }) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewTarget, setViewTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadRewardHistory = async () => {
      setIsLoading(true);
      try {
        const data = await fetchRewardTransactions({
          page: currentPage,
          limit: pageSize,
        });
        if (cancelled) return;

        setRows(data.rows);
        setTotalRecords(data.total);
      } catch (error) {
        if (cancelled) return;
        setRows([]);
        setTotalRecords(0);
        toastApiError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadRewardHistory();
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize]);

  const filteredRows = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) {
      to.setHours(23, 59, 59, 999);
    }

    return rows.filter((row) => {
      const rowDate = parseDate(row.createdAtRaw ?? row.createdAt);
      if (from && rowDate && rowDate < from) return false;
      if (to && rowDate && rowDate > to) return false;
      return true;
    });
  }, [fromDate, toDate, rows]);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows: filteredRows,
    columnLabel: "User Name",
  });

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
          "Reward Type",
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
        emptyMessage="No reward history found"
        // summaryCards={[
        //   { label: "Total Credit", value: summary.totalCredit },
        //   { label: "Total Debit", value: summary.totalDebit },
        //   { label: "Total Balance", value: summary.totalBalance },
        // ]}
        rowIdKey="id"
        showStatus
        statusAsText
        permissionModule="reward_history"
        actionVariant="reward-pending"
        showPagination
        serverPaginated
        totalRecords={totalRecords}
        paginationPage={currentPage}
        paginationPageSize={pageSize}
        onPaginationPageChange={setCurrentPage}
        onPaginationPageSizeChange={(nextSize) => {
          setPageSize(nextSize);
          setCurrentPage(1);
        }}
        onView={handleView}
        toolbarEnd={
          <AdminDateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
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
              }
            : null
        }
        onCancel={() => setViewTarget(null)}
      />
    </div>
  );
}

export default RewardHistoryPage;
