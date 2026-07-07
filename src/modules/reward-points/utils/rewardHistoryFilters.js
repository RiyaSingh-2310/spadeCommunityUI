export function normalizeRewardHistoryStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function isPendingRewardHistoryStatus(status) {
  const normalized = normalizeRewardHistoryStatus(status);
  return !normalized || normalized === "pending";
}

export function isViewOnlyRewardHistoryStatus(status) {
  const normalized = normalizeRewardHistoryStatus(status);
  return normalized === "completed" || normalized === "approved" || normalized === "rejected";
}

export function matchesRewardHistoryStatusFilter(row, statusFilter) {
  if (!statusFilter || statusFilter === "all") return true;

  const rowStatus = normalizeRewardHistoryStatus(row?.status);

  if (statusFilter === "pending") {
    return isPendingRewardHistoryStatus(rowStatus);
  }

  if (statusFilter === "completed") {
    return rowStatus === "completed" || rowStatus === "approved";
  }

  if (statusFilter === "rejected") {
    return rowStatus === "rejected";
  }

  return true;
}

export function parseRewardHistoryDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function matchesRewardHistoryDateRange(row, fromDate, toDate) {
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate) : null;

  if (to) {
    to.setHours(23, 59, 59, 999);
  }

  const rowDate = parseRewardHistoryDate(row?.createdAtRaw ?? row?.createdAt ?? row?.createdDate);
  if (from && rowDate && rowDate < from) return false;
  if (to && rowDate && rowDate > to) return false;
  return true;
}

export function filterRewardHistoryRows(rows, { statusFilter = "all", fromDate = "", toDate = "" } = {}) {
  return rows.filter(
    (row) =>
      matchesRewardHistoryStatusFilter(row, statusFilter) &&
      matchesRewardHistoryDateRange(row, fromDate, toDate)
  );
}

export function resolveRewardHistoryStatusQuery(statusFilter) {
  if (!statusFilter || statusFilter === "all") return "";
  if (statusFilter === "completed") return "approved";
  return statusFilter;
}
