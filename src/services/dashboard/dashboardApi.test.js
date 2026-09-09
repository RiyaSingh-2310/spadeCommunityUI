import { describe, expect, it } from "vitest";
import { mapDashboardSummary, mapTrend } from "./dashboardApi";

const SUMMARY_RESPONSE = {
  success: true,
  data: {
    totals: {
      total_users: 16,
      total_clients: 3,
      total_partners: 4,
      total_project_managers: 4,
    },
    survey: {
      status_distribution: {
        active: 7,
        closed: 0,
        draft: 0,
        paused: 0,
      },
      trend_last_12_months: [
        { month: "Aug 2026", count: 3 },
        { month: "Sept 2026", count: 4 },
      ],
    },
    rfq: {
      status_overview: {
        won: 2,
        lost: 1,
        pending: 2,
      },
      trend_last_12_months: [
        { month: "Aug 2026", count: 2 },
        { month: "Sept 2026", count: 3 },
      ],
    },
    user_growth: {
      trend_last_12_months: [
        { month: "Aug 2026", count: 9 },
        { month: "Sept 2026", count: 7 },
      ],
      by_country: [{ country: "Unknown", total: 16 }],
    },
    revenue: {
      total_revenue: 0,
      monthly_revenue: 0,
      pending_invoice_amount: 0,
      paid_invoice_amount: 0,
      invoice_status_distribution: {
        paid: 0,
        pending: 0,
        overdue: 0,
      },
    },
    clients_overview: {
      total: 3,
      active: 3,
      inactive: 0,
    },
    partners_overview: {
      total: 4,
      active: 4,
      inactive: 0,
    },
    reward_statistics: {
      pending_rewards: 0,
      completed_rewards: 17,
      total_redeemed_points: 0,
      total_reward_requests: 17,
      redemption_trend_last_12_months: [{ month: "Sept 2026", count: 0 }],
    },
  },
};

describe("mapDashboardSummary", () => {
  it("maps GET /api/dashboard/summary into dashboard widgets", () => {
    const summary = mapDashboardSummary(SUMMARY_RESPONSE);

    expect(summary.totals).toEqual({
      totalUsers: 16,
      totalClients: 3,
      totalPartners: 4,
      totalProjectManagers: 4,
    });
    expect(summary.surveyStatus).toEqual({
      active: 7,
      closed: 0,
      draft: 0,
      paused: 0,
    });
    expect(summary.rfqStatus).toEqual({ won: 2, lost: 1, pending: 2 });
    expect(summary.surveyTrend).toEqual([
      { label: "Aug", fullLabel: "Aug 2026", value: 3 },
      { label: "Sept", fullLabel: "Sept 2026", value: 4 },
    ]);
    expect(summary.rfqTrend.at(-1)).toEqual({
      label: "Sept",
      fullLabel: "Sept 2026",
      value: 3,
    });
    expect(summary.userTrend.at(-1)).toEqual({
      label: "Sept",
      fullLabel: "Sept 2026",
      value: 7,
    });
    expect(summary.usersByCountry).toEqual([
      { label: "Unknown", value: 16, color: "#10a950" },
    ]);
    expect(summary.clientsOverview).toEqual({ total: 3, active: 3, inactive: 0 });
    expect(summary.partnersOverview).toEqual({ total: 4, active: 4, inactive: 0 });
    expect(summary.rewardStats).toEqual({
      pending: 0,
      completed: 17,
      redeemedPoints: 0,
      totalRequests: 17,
    });
    expect(summary.revenue.totalRevenue).toBe(0);
    expect(summary.invoiceStats).toEqual({
      paid: 0,
      pending: 0,
      overdue: 0,
      paidAmount: 0,
      pendingAmount: 0,
    });
  });

  it("maps the inner data object without a success wrapper", () => {
    const summary = mapDashboardSummary(SUMMARY_RESPONSE.data);
    expect(summary.totals.totalUsers).toBe(16);
    expect(summary.surveyStatus.active).toBe(7);
  });
});

describe("mapTrend", () => {
  it("keeps compact month labels from API month strings", () => {
    expect(mapTrend([{ month: "Sept 2026", count: 4 }])).toEqual([
      { label: "Sept", fullLabel: "Sept 2026", value: 4 },
    ]);
  });
});
