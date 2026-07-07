import { useState } from "react";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import RewardDetailsModal from "../components/RewardDetailsModal";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { getAdminDisplayName } from "../../../services/auth/authStorage";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  fetchRedeemRequests,
  updateRedeemRequestStatus,
} from "../services/rewardHistoryApi";

function validateRejectComment(comment) {
  if (String(comment ?? "").trim().length < 3) {
    return "Comment must be at least 3 characters";
  }
  return "";
}

function PendingRewardsPage({ isDarkMode }) {
  const {
    rows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchRedeemList,
  } = useApiListing({
    fetchFn: fetchRedeemRequests,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });

  const [modalMode, setModalMode] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await fetchRedeemList();
      closeModal();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        rows={rows}
        rowIdKey="id"
        showStatus
        statusAsText
        actionVariant="reward-pending"
        permissionModule="pending_rewards"
        isLoading={isLoading}
        emptyMessage="No reward history found"
        onSearch={handleSearch}
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
      />

      <RewardDetailsModal
        isOpen={Boolean(modalMode && activeRow)}
        mode={modalMode ?? "view"}
        row={activeRow}
        comment={comment}
        commentError={commentError}
        isSubmitting={isSubmitting}
        onCommentChange={(value) => {
          setComment(value);
          if (commentError) setCommentError("");
        }}
        onCancel={closeModal}
        onConfirm={handleConfirm}
      />
    </>
  );
}

export default PendingRewardsPage;
