import { API_ROUTES } from "../../config/api";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";

function assertSuccess(data, fallbackMessage) {
  if (data && typeof data === "object" && "success" in data && data.success !== true) {
    throw new ApiError(data?.message || fallbackMessage, data);
  }
  return data;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function pick(source, ...keys) {
  const obj = asObject(source);
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== "") return obj[key];
  }
  return undefined;
}

function unwrapSummaryPayload(payload) {
  const root = asObject(payload);
  const nested = asObject(root.data);
  if (nested.totals || nested.survey || nested.rfq || nested.user_growth || nested.userGrowth) {
    return nested;
  }
  return root;
}

export function mapTrend(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const month = String(pick(item, "month", "label") ?? "").trim();
    const shortLabel = month.split(/\s+/)[0] || month || "—";
    return {
      label: shortLabel,
      fullLabel: month || shortLabel,
      value: toNumber(pick(item, "count", "value", "total"), 0),
    };
  });
}

const COUNTRY_COLORS = ["#10a950", "#0e7f3f", "#3ecf7f", "#6ddfa0", "#9ceec2"];

/**
 * Maps GET /api/dashboard/summary into the Admin Dashboard view model.
 * Accepts the wrapped `{ success, data }` body or the inner `data` object.
 */
export function mapDashboardSummary(payload) {
  const raw = unwrapSummaryPayload(payload);
  const totals = asObject(pick(raw, "totals"));
  const survey = asObject(pick(raw, "survey"));
  const rfq = asObject(pick(raw, "rfq"));
  const userGrowth = asObject(pick(raw, "user_growth", "userGrowth"));
  const revenue = asObject(pick(raw, "revenue"));
  const clientsOverview = asObject(pick(raw, "clients_overview", "clientsOverview"));
  const partnersOverview = asObject(pick(raw, "partners_overview", "partnersOverview"));
  const rewardStatistics = asObject(pick(raw, "reward_statistics", "rewardStatistics"));
  const surveyStatus = asObject(pick(survey, "status_distribution", "statusDistribution"));
  const rfqStatus = asObject(pick(rfq, "status_overview", "statusOverview"));
  const invoiceStatus = asObject(
    pick(revenue, "invoice_status_distribution", "invoiceStatusDistribution")
  );

  const byCountry = Array.isArray(pick(userGrowth, "by_country", "byCountry"))
    ? pick(userGrowth, "by_country", "byCountry")
    : [];

  return {
    totals: {
      totalUsers: toNumber(pick(totals, "total_users", "totalUsers")),
      totalClients: toNumber(pick(totals, "total_clients", "totalClients")),
      totalPartners: toNumber(pick(totals, "total_partners", "totalPartners")),
      totalProjectManagers: toNumber(
        pick(totals, "total_project_managers", "totalProjectManagers")
      ),
    },
    surveyStatus: {
      active: toNumber(pick(surveyStatus, "active")),
      closed: toNumber(pick(surveyStatus, "closed")),
      draft: toNumber(pick(surveyStatus, "draft")),
      paused: toNumber(pick(surveyStatus, "paused")),
    },
    surveyTrend: mapTrend(pick(survey, "trend_last_12_months", "trendLast12Months")),
    rfqStatus: {
      won: toNumber(pick(rfqStatus, "won")),
      lost: toNumber(pick(rfqStatus, "lost")),
      pending: toNumber(pick(rfqStatus, "pending")),
    },
    rfqTrend: mapTrend(pick(rfq, "trend_last_12_months", "trendLast12Months")),
    userTrend: mapTrend(pick(userGrowth, "trend_last_12_months", "trendLast12Months")),
    usersByCountry: byCountry.map((row, idx) => ({
      label: String(pick(row, "country", "label") ?? "Unknown").trim() || "Unknown",
      value: toNumber(pick(row, "total", "count", "value")),
      color: COUNTRY_COLORS[idx % COUNTRY_COLORS.length],
    })),
    revenue: {
      totalRevenue: toNumber(pick(revenue, "total_revenue", "totalRevenue")),
      monthlyRevenue: toNumber(pick(revenue, "monthly_revenue", "monthlyRevenue")),
      pendingInvoiceAmount: toNumber(
        pick(revenue, "pending_invoice_amount", "pendingInvoiceAmount")
      ),
      paidInvoiceAmount: toNumber(pick(revenue, "paid_invoice_amount", "paidInvoiceAmount")),
    },
    invoiceStats: {
      paid: toNumber(pick(invoiceStatus, "paid")),
      pending: toNumber(pick(invoiceStatus, "pending")),
      overdue: toNumber(pick(invoiceStatus, "overdue")),
      paidAmount: toNumber(pick(revenue, "paid_invoice_amount", "paidInvoiceAmount")),
      pendingAmount: toNumber(pick(revenue, "pending_invoice_amount", "pendingInvoiceAmount")),
    },
    clientsOverview: {
      total: toNumber(pick(clientsOverview, "total")),
      active: toNumber(pick(clientsOverview, "active")),
      inactive: toNumber(pick(clientsOverview, "inactive")),
    },
    partnersOverview: {
      total: toNumber(pick(partnersOverview, "total")),
      active: toNumber(pick(partnersOverview, "active")),
      inactive: toNumber(pick(partnersOverview, "inactive")),
    },
    rewardStats: {
      pending: toNumber(pick(rewardStatistics, "pending_rewards", "pendingRewards")),
      completed: toNumber(pick(rewardStatistics, "completed_rewards", "completedRewards")),
      redeemedPoints: toNumber(
        pick(rewardStatistics, "total_redeemed_points", "totalRedeemedPoints")
      ),
      totalRequests: toNumber(
        pick(rewardStatistics, "total_reward_requests", "totalRewardRequests")
      ),
    },
    rewardTrend: mapTrend(
      pick(rewardStatistics, "redemption_trend_last_12_months", "redemptionTrendLast12Months")
    ),
  };
}

/**
 * GET /api/dashboard/summary — aggregated admin dashboard analytics.
 */
export async function getDashboardSummary() {
  const data = assertSuccess(
    await apiRequest(API_ROUTES.dashboard.summary),
    "Failed to load dashboard summary."
  );

  return mapDashboardSummary(data);
}
