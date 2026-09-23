import { useCallback, useState } from "react";
import AdminDateRangeFilter from "../../../components/admin/AdminDateRangeFilter";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import RewardDetailsModal from "../components/RewardDetailsModal";
import RewardHistoryStatusFilter from "../components/RewardHistoryStatusFilter";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { formatSurveyListDate } from "../../shared/utils/dateTime";
import { getAdminDisplayName } from "../../../services/auth/authStorage";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  fetchRedeemRequests,
  updateRedeemRequestStatus,
} from "../services/rewardHistoryApi";

function validateAdminRemark(comment) {
  if (String(comment ?? "").trim().length < 3) {
    return "Admin remark must be at least 3 characters";
  }
  return "";
}

function resolvePreservedRedemptionMethod(row) {
  const candidates = [
    row?.redemptionMethod,
    row?.rewardType,
    row?.productName,
  ];
  for (const value of candidates) {
    const text = String(value ?? "").trim();
    const key = text.toLowerCase();
    if (
      text &&
      key !== "—" &&
      key !== "verified" &&
      key !== "rejected" &&
      key !== "approved"
    ) {
      return text;
    }
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
    async (params) => {
      const data = await fetchRedeemRequests({
        ...params,
        status: statusFilter,
        start_date: fromDate || undefined,
        end_date: toDate || undefined,
      });
      return {
        items: data.items,
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      };
    },
    [statusFilter, fromDate, toDate]
  );

  const {
    rows,
    setRows,
    totalRecords,
    totalPages,
    isLoading,
    listError,
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

  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: "User Name",
  });

  const resetModalState = () => {
    setModalMode(null);
    setActiveRow(null);
    setComment("");
    setCommentError("");
    setIsSubmitting(false);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    resetModalState();
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

  const handleFromDateChange = (value) => {
    setFromDate(value);
    handlePageChange(1);
  };

  const handleToDateChange = (value) => {
    setToDate(value);
    handlePageChange(1);
  };

  const applyLocalStatusUpdate = (targetId, updatedRow, nextStatus, adminRemark) => {
    const matchesId = (row) => String(row?.id) === String(targetId);
    setRows((prev) =>
      prev.map((row) => {
        if (!matchesId(row)) return row;
        if (updatedRow && typeof updatedRow === "object") {
          return {
            ...row,
            ...updatedRow,
            remark:
              updatedRow.panelistRemark ||
              updatedRow.remark ||
              row.panelistRemark ||
              row.remark ||
              "",
          };
        }
        return {
          ...row,
          status: nextStatus,
          adminRemark: adminRemark || row.adminRemark || "",
          comments: adminRemark || row.comments || "",
        };
      })
    );
  };

  const handleConfirm = async () => {
    if (!activeRow?.id || isSubmitting) return;

    if (modalMode !== "approve" && modalMode !== "reject") return;

    if (modalMode === "approve" || modalMode === "reject") {
      const error = validateAdminRemark(comment);
      if (error) {
        setCommentError(error);
        return;
      }
    }

    const targetId = activeRow.id;
    const isApprove = modalMode === "approve";
    const adminRemark = String(comment ?? "").trim();
    const preservedMethod = resolvePreservedRedemptionMethod(activeRow);
    const nextStatus = isApprove ? "Approved" : "Rejected";

    setIsSubmitting(true);
    try {
      const data = await updateRedeemRequestStatus(targetId, {
        status: isApprove ? "approved" : "rejected",
        actionBy: getAdminDisplayName(),
        remark: preservedMethod,
        comment: adminRemark,
      });

      toastApiSuccess(data);

      // Close modal only after mutation succeeds.
      resetModalState();

      // Apply mutation payload immediately so Action column flips before list returns.
      applyLocalStatusUpdate(targetId, data?.updatedRow, nextStatus, adminRemark);

      // Source of truth: re-fetch redeem list and replace table rows.
      await reloadRedeemList();
    } catch (error) {
      toastApiError(error);
      setIsSubmitting(false);
    }
  };

  const toolbarFilters = (
    <div className="flex w-full flex-wrap items-end justify-end gap-3 sm:flex-nowrap sm:gap-4 lg:w-auto">
      <AdminDateRangeFilter
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={handleFromDateChange}
        onToChange={handleToDateChange}
      />
      <RewardHistoryStatusFilter value={statusFilter} onChange={handleStatusFilterChange} />
    </div>
  );

  return (
    <>
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Reward Request"
        searchPlaceholder="Search reward requests..."
        columns={[
          "S.No",
          "User Name",
          "Reward Points",
          "Created Date",
          "Remark",
          "Status",
          "Action",
        ]}
        rows={sortedRows.map((row) => ({
          ...row,
          // Listing "Remark" = panelist remark for this redemption only.
          remark: row.panelistRemark || row.remark || "",
        }))}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="id"
        showStatus
        statusAsText
        actionVariant="reward-pending"
        permissionModule="pending_rewards"
        isLoading={isLoading}
        errorMessage={listError}
        onRetry={reloadRedeemList}
        emptyMessage="No reward requests found"
        onSearch={handleSearch}
        toolbarFilters={toolbarFilters}
        showPagination
        serverPaginated
        serverSearch
        totalRecords={totalRecords}
        paginationTotalPages={totalPages}
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
                updatedDate: formatSurveyListDate(
                  activeRow.updatedAtRaw ?? activeRow.updatedAt ?? activeRow.updatedDate
                ),
                panelistRemark: activeRow.panelistRemark || "",
                adminRemark: activeRow.adminRemark || activeRow.comments || "",
              }
            : activeRow
              ? {
                  ...activeRow,
                  panelistRemark: activeRow.panelistRemark || "",
                  adminRemark: activeRow.adminRemark || activeRow.comments || "",
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
