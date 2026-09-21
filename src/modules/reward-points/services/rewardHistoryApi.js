import { API_ROUTES } from "../../../config/api";
import { ApiError } from "../../../services/api/ApiError";
import { apiRequest } from "../../../services/api/client";
import { appendListQuery } from "../../shared/utils/listQueryParams";
import { formatSurveyListDate } from "../../shared/utils/dateTime";
import { toUiSentenceCase } from "../../shared/utils/uiText";

function assertSuccess(data) {
  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    data.success !== true &&
    data.success !== "true" &&
    data.success !== 1
  ) {
    throw new ApiError(data?.message ?? "Unable to fetch reward history.", data);
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

function mapRewardHistoryRow(item) {
  const transactionType = String(item?.transaction_type ?? "").trim().toLowerCase();
  const points = toNumber(item?.reward_points, 0);
  const credit = transactionType === "credit" ? points : 0;
  const debit = transactionType === "debit" ? points : 0;

  return {
    id: item?.id,
    userId: item?.user_id ?? null,
    userName: coerceText(item?.user_name, `User #${item?.user_id ?? "—"}`),
    rewardType: coerceText(item?.reward_type ?? item?.transaction_type),
    totalRewardCredit: String(credit),
    totalRewardDebit: String(debit),
    totalRewardBalance: String(credit - debit),
    rewardPoints: String(points),
    transactionType,
    status: normalizeStatus(item?.status),
    createdAt: formatSurveyListDate(item?.created_at),
    createdAtRaw: item?.created_at ?? "",
    createdDate: formatSurveyListDate(item?.created_at),
  };
}

/**
 * Redemption method lives in `remark` when the panelist submits.
 * Admin approve/reject notes live in `comment`.
 * Never treat status labels like "Verified"/"Rejected" as the method.
 */
function resolveRedemptionMethod(item) {
  const method = String(
    item?.redemption_method ??
      item?.redemptionMethod ??
      item?.reward_type ??
      item?.rewardType ??
      item?.product_name ??
      item?.productName ??
      item?.remark ??
      ""
  ).trim();
  const normalized = method.toLowerCase();
  if (!method || normalized === "verified" || normalized === "rejected") {
    return coerceText(
      item?.redemption_method ??
        item?.redemptionMethod ??
        item?.product_name ??
        item?.productName,
      "—"
    );
  }
  return method;
}

function resolveAdminRemark(item) {
  return String(item?.comment ?? item?.admin_remark ?? item?.adminRemark ?? "").trim();
}

function mapRedeemRequestRow(item) {
  const comments = resolveAdminRemark(item);
  const method = resolveRedemptionMethod(item);
  const productName = String(
    item?.product_name ?? item?.productName ?? item?.tremendous_product_name ?? ""
  ).trim();
  const productLogo = String(
    item?.product_logo ?? item?.productLogo ?? item?.tremendous_product_logo ?? ""
  ).trim();

  return {
    id: item?.id,
    userId: item?.user_id ?? null,
    userName: coerceText(item?.user_name, `User #${item?.user_id ?? "—"}`),
    email: coerceText(item?.user_email, "—"),
    rewardType: productName || method,
    redemptionMethod: method,
    productName,
    productLogo,
    rewardPoints: String(toNumber(item?.reward_points, 0)),
    requestedBy: coerceText(item?.requested_by, "—"),
    status: normalizeStatus(item?.status),
    // Keep raw method for preserve-on-update; display remark prefers admin comment.
    remark: comments || "",
    comments,
    actionBy: coerceText(item?.action_by, "—"),
    actionDate: item?.action_date ? formatSurveyListDate(item.action_date) : "—",
    actionDateRaw: item?.action_date ?? "",
    completedDate: item?.action_date ? formatSurveyListDate(item.action_date) : "",
    createdAt: formatSurveyListDate(item?.created_at),
    createdAtRaw: item?.created_at ?? "",
    createdDate: formatSurveyListDate(item?.created_at),
    updatedAt: formatSurveyListDate(item?.updated_at),
    updatedAtRaw: item?.updated_at ?? "",
  };
}

/** GET /api/reward-history/list */
export async function fetchRewardHistoryList({ page = 1, limit = 10, search } = {}) {
  const path = appendListQuery(API_ROUTES.rewardHistory.list, {
    page,
    limit,
    search,
  });
  const data = await apiRequest(path);
  assertSuccess(data);

  const items = Array.isArray(data?.data) ? data.data : [];
  const safePage = toNumber(data?.page, page);
  const safeLimit = toNumber(data?.limit, limit);

  return {
    rows: items.map((item) => mapRewardHistoryRow(item)),
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

/** GET /api/reward-history/redeem/list */
export async function fetchRedeemRequests({
  page = 1,
  limit = 10,
  search,
  status,
  start_date,
  end_date,
} = {}) {
  const extra = {};
  const statusQuery = String(status ?? "").trim().toLowerCase();

  if (statusQuery && statusQuery !== "all") {
    extra.status = statusQuery === "completed" ? "approved" : statusQuery;
  }
  if (start_date) extra.start_date = start_date;
  if (end_date) extra.end_date = end_date;

  const path = appendListQuery(API_ROUTES.rewardHistory.redeemList, {
    page,
    limit,
    search,
    extra,
  });
  const data = await apiRequest(path);
  assertSuccess(data);

  const items = Array.isArray(data?.data) ? data.data : [];
  const safePage = toNumber(data?.page, page);
  const safeLimit = toNumber(data?.limit, limit);

  return {
    items: items.map((item) => mapRedeemRequestRow(item)),
    total: toNumber(data?.total, 0),
    page: safePage,
    limit: safeLimit,
    totalPages: toNumber(data?.totalPages, 1),
  };
}

/** PATCH /api/reward-history/redeem/:id/status */
export async function updateRedeemRequestStatus(
  id,
  { status, actionBy, remark = "", comment = "" } = {}
) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) {
    throw new ApiError("Redeem request id is required.");
  }

  const normalizedStatus = String(status ?? "").trim().toLowerCase();
  if (normalizedStatus !== "approved" && normalizedStatus !== "rejected") {
    throw new ApiError("Status must be approved or rejected.");
  }

  const actionByText = String(actionBy ?? "").trim();
  if (!actionByText) {
    throw new ApiError("Action by is required.");
  }

  const remarkText = String(remark ?? "").trim();
  const commentText = String(comment ?? "").trim();

  const data = await apiRequest(API_ROUTES.rewardHistory.redeemUpdateStatus(normalizedId), {
    method: "PATCH",
    body: {
      status: normalizedStatus,
      action_by: actionByText,
      // `remark` = redemption method (preserve). `comment` = admin remark/note.
      remark: remarkText,
      comment: commentText,
    },
  });

  const success = assertSuccess(data);
  const updatedRow =
    success?.data && typeof success.data === "object"
      ? mapRedeemRequestRow(success.data)
      : null;

  return {
    ...success,
    updatedRow,
  };
}
