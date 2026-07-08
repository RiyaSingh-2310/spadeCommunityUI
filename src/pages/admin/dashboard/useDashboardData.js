import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Handshake, UserCog, Users } from "lucide-react";
import { isSalesLoginRole } from "../../../services/auth/loginRole";
import { getRecords as getUserRecords } from "../../../services/users/usersApi";
import { getRecords as getClientRecords } from "../../../services/clients/clientsApi";
import { getRecords as getPartnerRecords } from "../../../services/partners/partnersApi";
import { getRecords as getProjectManagerRecords } from "../../../services/projectManagers/projectManagersApi";
import { getRecords as getSalesManagerRecords } from "../../../services/sales/salesManagersApi";
import { getRecords as getRfqRecords } from "../../../services/sales/salesProjectsApi";
import { getRecords as getSurveyRecords } from "../../../modules/survey/services/surveyApi";
import { getRecords as getGroupSurveyRecords } from "../../../modules/survey/services/groupSurveyApi";
import {
  buildMonthlySeries,
  fetchWithFallback,
  normalizeStatus,
} from "./dashboardUtils";

const EMPTY_DASHBOARD = {
  loading: false,
  users: [],
  clients: [],
  partners: [],
  projectManagers: [],
  salesManagers: [],
  rfqs: [],
  surveys: [],
  groupSurveys: [],
  invoices: [],
  rewards: [],
  logs: [],
};

export function useDashboardData({ enabled = true } = {}) {
  const isSales = isSalesLoginRole();
  const [dashboard, setDashboard] = useState({
    ...EMPTY_DASHBOARD,
    loading: enabled && !isSales,
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    const loadDashboard = async () => {
      if (!isSales) setDashboard((prev) => ({ ...prev, loading: true }));
      try {
        const [
          userData,
          clientData,
          partnerData,
          pmData,
          smData,
          rfqData,
          surveyData,
          groupSurveyData,
          invoiceData,
          rewardData,
          logData,
        ] = await Promise.all([
          getUserRecords({ page: 1, limit: 500 }),
          getClientRecords({ page: 1, limit: 500 }),
          getPartnerRecords({ page: 1, limit: 500 }),
          getProjectManagerRecords({ page: 1, limit: 500 }),
          getSalesManagerRecords({ page: 1, limit: 500 }),
          getRfqRecords({ page: 1, limit: 5 }),
          getSurveyRecords({ page: 1, limit: 500 }),
          getGroupSurveyRecords({ page: 1, limit: 500 }),
          fetchWithFallback(["/api/invoice/list", "/api/invoices/list"]),
          fetchWithFallback(["/api/reward/list", "/api/rewards/list", "/api/reward-points/list"]),
          fetchWithFallback(["/api/log-activity/list", "/api/log/activity/list", "/api/activity/list"]),
        ]);
        if (cancelled) return;
        setDashboard({
          loading: false,
          users: userData.items ?? [],
          clients: clientData.items ?? [],
          partners: partnerData.items ?? [],
          projectManagers: pmData.items ?? [],
          salesManagers: smData.items ?? [],
          rfqs: rfqData.items ?? [],
          surveys: surveyData.items ?? [],
          groupSurveys: groupSurveyData.items ?? [],
          invoices: invoiceData.items ?? [],
          rewards: rewardData.items ?? [],
          logs: logData.items ?? [],
        });
      } catch {
        if (cancelled) return;
        setDashboard((prev) => ({ ...prev, loading: false }));
      }
    };
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [enabled, isSales]);

  const surveyStatus = useMemo(() => {
    const result = { active: 0, closed: 0, draft: 0, paused: 0 };
    dashboard.surveys.forEach((s) => {
      const st = normalizeStatus(s.status);
      if (st.includes("active")) result.active += 1;
      else if (st.includes("closed")) result.closed += 1;
      else if (st.includes("draft")) result.draft += 1;
      else if (st.includes("pause")) result.paused += 1;
    });
    return result;
  }, [dashboard.surveys]);

  const rfqStatus = useMemo(() => {
    const result = { won: 0, lost: 0, pending: 0 };
    dashboard.rfqs.forEach((rfq) => {
      const st = normalizeStatus(rfq.status);
      if (st === "won") result.won += 1;
      else if (st === "lost") result.lost += 1;
      else result.pending += 1;
    });
    return result;
  }, [dashboard.rfqs]);

  const usersByCountry = useMemo(() => {
    const map = new Map();
    dashboard.users.forEach((u) => {
      const country = String(u.country ?? "Unknown").trim() || "Unknown";
      map.set(country, (map.get(country) ?? 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], idx) => ({
        label,
        value,
        color: ["#10a950", "#0e7f3f", "#3ecf7f", "#6ddfa0", "#9ceec2"][idx],
      }));
  }, [dashboard.users]);

  const invoiceStats = useMemo(() => {
    const stats = { total: 0, paid: 0, pending: 0, overdue: 0, paidAmount: 0, pendingAmount: 0 };
    dashboard.invoices.forEach((inv) => {
      const amount = Number(inv.amount ?? inv.grossAmount ?? inv.total ?? 0) || 0;
      const status = normalizeStatus(inv.status);
      stats.total += 1;
      if (status.includes("paid")) {
        stats.paid += 1;
        stats.paidAmount += amount;
      } else if (status.includes("overdue")) {
        stats.overdue += 1;
        stats.pendingAmount += amount;
      } else {
        stats.pending += 1;
        stats.pendingAmount += amount;
      }
    });
    return stats;
  }, [dashboard.invoices]);

  const rewardStats = useMemo(() => {
    const stats = { pending: 0, completed: 0, redeemedPoints: 0, totalRequests: dashboard.rewards.length };
    dashboard.rewards.forEach((r) => {
      const status = normalizeStatus(r.status);
      const points = Number(r.redeem_points ?? r.points ?? 0) || 0;
      if (status.includes("pending")) stats.pending += 1;
      if (status.includes("complete")) stats.completed += 1;
      if (status.includes("complete") || status.includes("approved")) stats.redeemedPoints += points;
    });
    return stats;
  }, [dashboard.rewards]);

  const kpiRows = [
    [
      { icon: Users, label: "Total Users", value: dashboard.users.length },
      { icon: UserCog, label: "Total Clients", value: dashboard.clients.length },
      { icon: Handshake, label: "Total Partners", value: dashboard.partners.length },
      { icon: ClipboardList, label: "Total Project Managers", value: dashboard.projectManagers.length },
    ],
  ];

  return {
    isSales,
    dashboard,
    surveyStatus,
    rfqStatus,
    usersByCountry,
    invoiceStats,
    rewardStats,
    kpiRows,
    latestSurveys: dashboard.surveys.slice(0, 5),
    latestRfqs: dashboard.rfqs.slice(0, 5),
    surveyTrend: buildMonthlySeries(dashboard.surveys, "createdAt"),
    rfqTrend: buildMonthlySeries(dashboard.rfqs, "createdAt"),
    userTrend: buildMonthlySeries(dashboard.users, "createdAt"),
    rewardTrend: buildMonthlySeries(dashboard.rewards, "created_at"),
  };
}
