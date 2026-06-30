/**
 * RFQ listing status display — shows API values with semantic color coding.
 */

function normalizeRfqStatusKey(status) {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function formatRfqStatusDisplay(status) {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";

  const key = normalizeRfqStatusKey(raw);
  const mapped = {
    wip: "WIP",
    won: "Won",
    lost: "Lost",
    in_progress: "In Progress",
    pending: "Pending",
    draft: "Draft",
    completed: "Completed",
  };

  return mapped[key] ?? raw;
}

export function getRfqStatusTone(status) {
  const key = normalizeRfqStatusKey(status);

  if (["completed", "won", "complete"].includes(key)) return "success";
  if (["wip", "in_progress", "work_in_progress"].includes(key)) return "warning";
  if (["pending"].includes(key)) return "pending";
  if (["lost", "cancelled", "canceled", "rejected"].includes(key)) return "danger";
  if (["draft"].includes(key)) return "neutral";
  return "neutral";
}

const TONE_CLASS = {
  success: "bg-[var(--admin-success-text)]/15 text-[var(--admin-success-text)]",
  warning: "bg-[var(--admin-warning-text)]/15 text-[var(--admin-warning-text)]",
  pending: "bg-[#f59e0b]/15 text-[#d97706]",
  danger: "bg-[var(--admin-danger-text)]/15 text-[var(--admin-danger-text)]",
  neutral: "bg-[var(--admin-header-search-bg)] text-[var(--admin-muted-foreground)]",
};

function RfqStatusBadge({ status }) {
  const label = formatRfqStatusDisplay(status);
  const tone = getRfqStatusTone(status);

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}

export default RfqStatusBadge;
