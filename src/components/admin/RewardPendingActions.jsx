import { Check, X } from "lucide-react";

function RewardPendingActions({ isDarkMode, row, onApprove, onReject }) {
  if (!onApprove && !onReject) {
    return null;
  }

  const canActOnReward =
    !row?.status || String(row.status).toLowerCase() === "pending";

  const base =
    "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors";

  return (
    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
      {onApprove && canActOnReward && (
      <button
        type="button"
        onClick={onApprove}
        className={`${base} ${
          isDarkMode
            ? "text-[#7dd4a0] hover:bg-[#1a3328]"
            : "text-[#138842] hover:bg-[#e6f6ee]"
        }`}
        aria-label="approve"
      >
        <Check size={13} />
        Approve
      </button>
      )}
      {onReject && canActOnReward && (
      <button
        type="button"
        onClick={onReject}
        className={`${base} ${
          isDarkMode
            ? "text-[#f18484] hover:bg-[#301f2d]"
            : "text-[#de3d3d] hover:bg-[#fff1f1]"
        }`}
        aria-label="reject"
      >
        <X size={13} />
        Reject
      </button>
      )}
    </div>
  );
}

export default RewardPendingActions;
