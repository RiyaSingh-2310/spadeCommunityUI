import { useState } from "react";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import RewardDetailsModal from "../components/RewardDetailsModal";

const REWARD_TYPES = ["Registration Reward", "Survey Completion", "Reward Redemption"];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `pr-${idx + 1}`,
  userName: `user_${idx + 1}`,
  email: `user_${idx + 1}@example.com`,
  rewardType: REWARD_TYPES[idx % REWARD_TYPES.length],
  rewardPoints: String(500 + idx * 100),
  createdDate: `${String(1 + (idx % 28)).padStart(2, "0")}/06/2026`,
  status: "Pending",
}));

function validateRejectComment(comment) {
  if (String(comment ?? "").trim().length < 3) {
    return "Comment must be at least 3 characters";
  }
  return "";
}

function PendingRewardsPage({ isDarkMode }) {
  const [rows, setRows] = useState(initialRows);
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

  const handleConfirm = () => {
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
      setRows((prev) => prev.filter((item) => item.id !== activeRow.id));
      closeModal();
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
        nowrapAllCells
        compactTable
        showPagination
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
