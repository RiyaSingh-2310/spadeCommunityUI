import { useCallback, useMemo, useState } from "react";
import AdminDateRangeFilter from "../../../components/admin/AdminDateRangeFilter";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import RewardDetailsModal from "../components/RewardDetailsModal";
import RewardHistoryStatusFilter from "../components/RewardHistoryStatusFilter";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { formatSurveyListDate } from "../../shared/utils/dateTime";
import { getAdminDisplayName } from "../../../services/auth/authStorage";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  fetchRedeemRequests,
  updateRedeemRequestStatus,
} from "../services/rewardHistoryApi";
import { filterRewardHistoryRows } from "../utils/rewardHistoryFilters";

function validateRejectComment(comment) {
  if (String(comment ?? "").trim().length < 3) {
    return "Comment must be at least 3 characters";
  }
  return "";
}

function PendingRewardsPage({ isDarkMode }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRedeemList = useCallback(
    (params) =>
      fetchRedeemRequests({
        ...params,
        status: statusFilter,
      }),
    [statusFilter]
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
    refresh: reloadRedeemList,
  } = useApiListing({
    fetchFn: fetchRedeemList,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });

  const filteredRows = useMemo(
    () =>
      filterRewardHistoryRows(rows, {
        statusFilter,
        fromDate,
        toDate,
      }),
    [rows, statusFilter, fromDate, toDate]
  );

  const closeModal = () => {
    if (isSubmitting) return;
    setModalMode(null);
    setActiveRow(null);
    setComment("");
    setCommentError("");
  };

  const openModal = (mode, row) => {
    setModalMode(mode);
    setActiveRow(row);
    setComment("");
    setCommentError("");
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    handlePageChange(1);
  };

  const handleConfirm = async () => {
    if (!activeRow?.id) return;

    if (modalMode === "reject") {
      const error = validateRejectComment(comment);
      if (error) {
        setCommentError(error);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const isApprove = modalMode === "approve";
      const data = await updateRedeemRequestStatus(activeRow.id, {
        status: isApprove ? "approved" : "rejected",
        actionBy: getAdminDisplayName(),
        remark: isApprove ? "Verified" : "Rejected",
        comment,
      });

      toastApiSuccess(data);
      await reloadRedeemList();
      closeModal();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toolbarFilters = (
    <div className="flex w-full flex-wrap items-end justify-end gap-3 sm:flex-nowrap sm:gap-4 lg:w-auto">
      <AdminDateRangeFilter
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
      />
      <RewardHistoryStatusFilter value={statusFilter} onChange={handleStatusFilterChange} />
    </div>
  );

  return (
    <>
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Reward History"
        searchPlaceholder="Search reward history..."
        columns={[
          "S.No",
          "User Name",
          "Reward Type",
          "Reward Points",
          "Created Date",
          "Status",
          "Action",
        ]}
        rows={filteredRows}
        rowIdKey="id"
        showStatus
        statusAsText
        actionVariant="reward-pending"
        permissionModule="pending_rewards"
        isLoading={isLoading}
        emptyMessage="No reward history found"
        onSearch={handleSearch}
        toolbarFilters={toolbarFilters}
        showPagination
        serverPaginated
        serverSearch
        totalRecords={totalRecords}
        paginationPage={currentPage}
        onPaginationPageChange={handlePageChange}
        paginationPageSize={pageSize}
        onPaginationPageSizeChange={handlePageSizeChange}
        onApprove={(row) => openModal("approve", row)}
        onReject={(row) => openModal("reject", row)}
        onView={(row) => openModal("view", row)}
      />

      <RewardDetailsModal
        isOpen={Boolean(modalMode && activeRow)}
        mode={modalMode ?? "view"}
        row={
          activeRow && modalMode === "view"
            ? {
                ...activeRow,
                createdDate: formatSurveyListDate(
                  activeRow.createdAtRaw ?? activeRow.createdAt ?? activeRow.createdDate
                ),
              }
            : activeRow
        }
        comment={comment}
        commentError={commentError}
        isSubmitting={isSubmitting}
        onCommentChange={(value) => {
          setComment(value);
          if (commentError) setCommentError("");
        }}
        onCancel={closeModal}
        onConfirm={modalMode === "view" ? undefined : handleConfirm}
      />
    </>
  );
}

export default PendingRewardsPage;
