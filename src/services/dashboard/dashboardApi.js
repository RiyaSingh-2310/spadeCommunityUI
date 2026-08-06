import { API_ROUTES } from "../../config/api";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";

function assertSuccess(data, fallbackMessage) {
  if (data?.success !== true) {
    throw new ApiError(data?.message || fallbackMessage, data);
  }
  return data;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapTrend(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const month = String(item?.month ?? "").trim();
    const shortLabel = month.split(/\s+/)[0] || month || "—";
    return {
      label: shortLabel,
      value: toNumber(item?.count, 0),
    };
  });
}

const COUNTRY_COLORS = ["#10a950", "#0e7f3f", "#3ecf7f", "#6ddfa0", "#9ceec2"];

/**
 * GET /api/dashboard/summary — aggregated admin dashboard analytics.
 */
export async function getDashboardSummary() {
  const data = assertSuccess(
    await apiRequest(API_ROUTES.dashboard.summary),
    "Failed to load dashboard summary."
  );

  const raw = data?.data && typeof data.data === "object" ? data.data : {};
  const totals = raw.totals ?? {};
  const survey = raw.survey ?? {};
  const rfq = raw.rfq ?? {};
  const userGrowth = raw.user_growth ?? {};
  const revenue = raw.revenue ?? {};
  const clientsOverview = raw.clients_overview ?? {};
  const partnersOverview = raw.partners_overview ?? {};
  const rewardStatistics = raw.reward_statistics ?? {};
  const surveyStatus = survey.status_distribution ?? {};
  const rfqStatus = rfq.status_overview ?? {};
  const invoiceStatus = revenue.invoice_status_distribution ?? {};

  const byCountry = Array.isArray(userGrowth.by_country)
    ? userGrowth.by_country
    : [];

  return {
    totals: {
      totalUsers: toNumber(totals.total_users),
      totalClients: toNumber(totals.total_clients),
      totalPartners: toNumber(totals.total_partners),
      totalProjectManagers: toNumber(totals.total_project_managers),
    },
    surveyStatus: {
      active: toNumber(surveyStatus.active),
      closed: toNumber(surveyStatus.closed),
      draft: toNumber(surveyStatus.draft),
      paused: toNumber(surveyStatus.paused),
    },
    surveyTrend: mapTrend(survey.trend_last_12_months),
    rfqStatus: {
      won: toNumber(rfqStatus.won),
      lost: toNumber(rfqStatus.lost),
      pending: toNumber(rfqStatus.pending),
    },
    rfqTrend: mapTrend(rfq.trend_last_12_months),
    userTrend: mapTrend(userGrowth.trend_last_12_months),
    usersByCountry: byCountry
      .slice(0, 5)
      .map((row, idx) => ({
        label: String(row?.country ?? "Unknown").trim() || "Unknown",
        value: toNumber(row?.total),
        color: COUNTRY_COLORS[idx % COUNTRY_COLORS.length],
      })),
    revenue: {
      totalRevenue: toNumber(revenue.total_revenue),
      monthlyRevenue: toNumber(revenue.monthly_revenue),
      pendingInvoiceAmount: toNumber(revenue.pending_invoice_amount),
      paidInvoiceAmount: toNumber(revenue.paid_invoice_amount),
    },
    invoiceStats: {
      paid: toNumber(invoiceStatus.paid),
      pending: toNumber(invoiceStatus.pending),
      overdue: toNumber(invoiceStatus.overdue),
      paidAmount: toNumber(revenue.paid_invoice_amount),
      pendingAmount: toNumber(revenue.pending_invoice_amount),
    },
    clientsOverview: {
      total: toNumber(clientsOverview.total),
      active: toNumber(clientsOverview.active),
      inactive: toNumber(clientsOverview.inactive),
    },
    partnersOverview: {
      total: toNumber(partnersOverview.total),
      active: toNumber(partnersOverview.active),
      inactive: toNumber(partnersOverview.inactive),
    },
    rewardStats: {
      pending: toNumber(rewardStatistics.pending_rewards),
      completed: toNumber(rewardStatistics.completed_rewards),
      redeemedPoints: toNumber(rewardStatistics.total_redeemed_points),
      totalRequests: toNumber(rewardStatistics.total_reward_requests),
    },
    rewardTrend: mapTrend(rewardStatistics.redemption_trend_last_12_months),
  };
}
