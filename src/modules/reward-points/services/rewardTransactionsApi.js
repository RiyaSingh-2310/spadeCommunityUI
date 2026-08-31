import { API_ROUTES } from "../../../config/api";
import { ApiError } from "../../../services/api/ApiError";
import { apiRequest } from "../../../services/api/client";
import { formatSurveyListDate } from "../../shared/utils/dateTime";
import { toUiSentenceCase } from "../../shared/utils/uiText";

function assertSuccess(data) {
  if (data?.success !== true && data?.success !== "true") {
    throw new ApiError(data?.message ?? "Unable to fetch reward transactions.", data);
  }
  return data;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value) {
  const status = String(value ?? "").trim();
  if (!status) return "Pending";
  return toUiSentenceCase(status);
}

function coerceText(value, fallback = "—") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function mapRewardTransactionRow(item, idx, page, limit) {
  const transactionType = String(item?.transaction_type ?? "").trim().toLowerCase();
  const points = toNumber(item?.reward_points, 0);
  const credit = transactionType === "credit" ? points : 0;
  const debit = transactionType === "debit" ? points : 0;
  const fallbackId = `rt-${page}-${limit}-${idx + 1}`;

  return {
    id: item?.id ?? fallbackId,
    userId: item?.user_id ?? null,
    userName: coerceText(item?.user_name, `User #${item?.user_id ?? "—"}`),
    email: coerceText(item?.user_email, "—"),
    rewardType: coerceText(item?.remark ?? item?.transaction_type),
    totalRewardCredit: String(credit),
    totalRewardDebit: String(debit),
    totalRewardBalance: String(credit - debit),
    rewardPoints: String(points),
    status: normalizeStatus(item?.status),
    remark: coerceText(item?.remark, ""),
    comments: coerceText(item?.comment, ""),
    createdAt: formatSurveyListDate(item?.created_at),
    createdAtRaw: item?.created_at ?? "",
    createdDate: formatSurveyListDate(item?.created_at),
  };
}

function mapRewardTransactionDetail(item) {
  return {
    ...mapRewardTransactionRow(item, 0, 1, 1),
    transactionType: String(item?.transaction_type ?? "").trim().toLowerCase(),
    transactionBy: item?.transaction_by ?? "—",
    referenceId: item?.reference_id ?? null,
    updatedAt: formatSurveyListDate(item?.updated_at),
    updatedAtRaw: item?.updated_at ?? "",
  };
}

/** GET /api/rewards/transactions/list */
export async function fetchRewardTransactions({ page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const data = await apiRequest(`${API_ROUTES.rewardTransactions.list}?${params.toString()}`);
  assertSuccess(data);

  const items = Array.isArray(data?.data) ? data.data : [];
  const safePage = toNumber(data?.page, page);
  const safeLimit = toNumber(data?.limit, limit);

  return {
    rows: items.map((item, idx) => mapRewardTransactionRow(item, idx, safePage, safeLimit)),
    total: toNumber(data?.total, 0),
    page: safePage,
    limit: safeLimit,
    totalPages: toNumber(data?.totalPages, 1),
    summary: {
      totalCredit: toNumber(data?.summary?.total_credit, 0),
      totalDebit: toNumber(data?.summary?.total_debit, 0),
      totalBalance: toNumber(data?.summary?.total_balance, 0),
    },
  };
}

/** GET /api/rewards/transactions/:id */
export async function fetchRewardTransactionById(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) {
    throw new ApiError("Transaction id is required.");
  }

  const data = await apiRequest(API_ROUTES.rewardTransactions.byId(normalizedId));
  assertSuccess(data);

  if (!data?.data || typeof data.data !== "object") {
    throw new ApiError("Reward transaction details not found.", data);
  }

  return mapRewardTransactionDetail(data.data);
}

function resolveUserId(row) {
  if (row?.userId != null) return toNumber(row.userId, null);
  if (row?.user_id != null) return toNumber(row.user_id, null);
  if (typeof row?.id === "number") return row.id;
  return null;
}

/** POST /api/rewards/transactions/add */
export async function addRewardTransaction({
  row,
  transactionType = "credit",
  status = "completed",
  transactionBy = "Admin",
  comment = "",
  referenceId = null,
} = {}) {
  const userId = resolveUserId(row);
  if (!userId) {
    throw new ApiError("User id is required to add reward transaction.");
  }

  const rewardPoints = toNumber(row?.rewardPoints, 0);
  if (rewardPoints <= 0) {
    throw new ApiError("Reward points must be greater than zero.");
  }

  const payload = {
    user_id: userId,
    reward_points: rewardPoints,
    transaction_type: String(transactionType).trim().toLowerCase() === "debit" ? "debit" : "credit",
    transaction_by: String(transactionBy ?? "Admin").trim() || "Admin",
    remark: String(row?.rewardType ?? "").trim() || "Reward Transaction",
    reference_id: referenceId,
    status: String(status ?? "completed").trim() || "completed",
    comment: String(comment ?? "").trim(),
  };

  const data = await apiRequest(API_ROUTES.rewardTransactions.add, {
    method: "POST",
    body: payload,
  });
  assertSuccess(data);
  return data;
}
