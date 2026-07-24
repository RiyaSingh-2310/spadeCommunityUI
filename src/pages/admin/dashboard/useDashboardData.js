import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Handshake, UserCog, Users } from "lucide-react";
import {
  isManagerLoginRole,
  isSalesLoginRole,
} from "../../../services/auth/loginRole";
import { getRecords as getUserRecords } from "../../../services/users/usersApi";
import { getRecords as getClientRecords } from "../../../services/clients/clientsApi";
import { getRecords as getPartnerRecords } from "../../../services/partners/partnersApi";
import { getRecords as getProjectManagerRecords } from "../../../services/projectManagers/projectManagersApi";
import { getRecords as getRfqRecords } from "../../../services/sales/salesProjectsApi";
import { getRecords as getSurveyRecords } from "../../../modules/survey/services/surveyApi";
import { getRecords as getGroupSurveyRecords } from "../../../modules/survey/services/groupSurveyApi";
import { MAX_API_LIST_LIMIT } from "../../../modules/shared/utils/listQueryParams";
import {
  buildMonthlySeries,
  fetchWithFallback,
  normalizeStatus,
} from "./dashboardUtils";

const DASHBOARD_LIST_LIMIT = MAX_API_LIST_LIMIT;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

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
  const isManager = isManagerLoginRole();
  const useScopedDashboard = isSales || isManager;
  const [dashboard, setDashboard] = useState({
    ...EMPTY_DASHBOARD,
    loading: Boolean(enabled),
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    const loadDashboard = async () => {
      setDashboard((prev) => ({ ...prev, loading: true }));

      try {
        if (isSales) {
          const [rfqData, surveyData] = await Promise.all([
            getRfqRecords({ page: 1, limit: 5 }),
            getSurveyRecords({ page: 1, limit: DASHBOARD_LIST_LIMIT }),
          ]);

          if (cancelled) return;
          setDashboard({
            ...EMPTY_DASHBOARD,
            loading: false,
            rfqs: asArray(rfqData.items),
            surveys: asArray(surveyData.items),
          });
          return;
        }

        if (isManager) {
          const [surveyData, groupSurveyData] = await Promise.all([
            getSurveyRecords({ page: 1, limit: DASHBOARD_LIST_LIMIT }),
            getGroupSurveyRecords({ page: 1, limit: DASHBOARD_LIST_LIMIT }),
          ]);

          if (cancelled) return;
          setDashboard({
            ...EMPTY_DASHBOARD,
            loading: false,
            surveys: asArray(surveyData.items),
            groupSurveys: asArray(groupSurveyData.items),
          });
          return;
        }

        const [
          userData,
          clientData,
          partnerData,
          pmData,
          rfqData,
          surveyData,
          invoiceData,
          rewardData,
          logData,
        ] = await Promise.all([
          getUserRecords({ page: 1, limit: DASHBOARD_LIST_LIMIT }),
          getClientRecords({ page: 1, limit: DASHBOARD_LIST_LIMIT }),
          getPartnerRecords({ page: 1, limit: DASHBOARD_LIST_LIMIT }),
          getProjectManagerRecords({ page: 1, limit: DASHBOARD_LIST_LIMIT }),
          getRfqRecords({ page: 1, limit: 5 }),
          getSurveyRecords({ page: 1, limit: DASHBOARD_LIST_LIMIT }),
          fetchWithFallback(["/api/invoice/list", "/api/invoices/list"]),
          fetchWithFallback([
            "/api/reward/list",
            "/api/rewards/list",
            "/api/reward-points/list",
          ]),
          fetchWithFallback([
            "/api/log-activity/list",
            "/api/log/activity/list",
            "/api/activity/list",
          ]),
        ]);

        if (cancelled) return;
        setDashboard({
          ...EMPTY_DASHBOARD,
          loading: false,
          users: asArray(userData.items),
          clients: asArray(clientData.items),
          partners: asArray(partnerData.items),
          projectManagers: asArray(pmData.items),
          rfqs: asArray(rfqData.items),
          surveys: asArray(surveyData.items),
          invoices: asArray(invoiceData.items),
          rewards: asArray(rewardData.items),
          logs: asArray(logData.items),
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
  }, [enabled, isSales, isManager, useScopedDashboard]);

  const surveyStatus = useMemo(() => {
    const result = { active: 0, closed: 0, draft: 0, paused: 0 };
    asArray(dashboard.surveys).forEach((s) => {
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
    asArray(dashboard.rfqs).forEach((rfq) => {
      const st = normalizeStatus(rfq.status);
      if (st === "won") result.won += 1;
      else if (st === "lost") result.lost += 1;
      else result.pending += 1;
    });
    return result;
  }, [dashboard.rfqs]);

  const usersByCountry = useMemo(() => {
    const map = new Map();
    asArray(dashboard.users).forEach((u) => {
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
    const stats = {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };
    asArray(dashboard.invoices).forEach((inv) => {
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
    const rewards = asArray(dashboard.rewards);
    const stats = {
      pending: 0,
      completed: 0,
      redeemedPoints: 0,
      totalRequests: rewards.length,
    };
    rewards.forEach((r) => {
      const status = normalizeStatus(r.status);
      const points = Number(r.redeem_points ?? r.points ?? 0) || 0;
      if (status.includes("pending")) stats.pending += 1;
      if (status.includes("complete")) stats.completed += 1;
      if (status.includes("complete") || status.includes("approved")) {
        stats.redeemedPoints += points;
      }
    });
    return stats;
  }, [dashboard.rewards]);

  const users = asArray(dashboard.users);
  const clients = asArray(dashboard.clients);
  const partners = asArray(dashboard.partners);
  const projectManagers = asArray(dashboard.projectManagers);
  const surveys = asArray(dashboard.surveys);
  const groupSurveys = asArray(dashboard.groupSurveys);
  const rfqs = asArray(dashboard.rfqs);
  const rewards = asArray(dashboard.rewards);

  const kpiRows = isManager
    ? [
        [
          { icon: ClipboardList, label: "Total Projects", value: surveys.length },
          { icon: ClipboardList, label: "Group Surveys", value: groupSurveys.length },
          {
            icon: ClipboardList,
            label: "Active Projects",
            value: surveys.filter((s) =>
              normalizeStatus(s.status).includes("active")
            ).length,
          },
          {
            icon: ClipboardList,
            label: "Draft Projects",
            value: surveys.filter((s) =>
              normalizeStatus(s.status).includes("draft")
            ).length,
          },
        ],
      ]
    : [
        [
          { icon: Users, label: "Total Users", value: users.length },
          { icon: UserCog, label: "Total Clients", value: clients.length },
          { icon: Handshake, label: "Total Partners", value: partners.length },
          {
            icon: ClipboardList,
            label: "Total Project Managers",
            value: projectManagers.length,
          },
        ],
      ];

  return {
    isSales,
    isManager,
    dashboard: {
      ...dashboard,
      users,
      clients,
      partners,
      projectManagers,
      surveys,
      groupSurveys,
      rfqs,
      rewards,
      invoices: asArray(dashboard.invoices),
      logs: asArray(dashboard.logs),
    },
    surveyStatus,
    rfqStatus,
    usersByCountry,
    invoiceStats,
    rewardStats,
    kpiRows,
    latestSurveys: surveys.slice(0, 5),
    latestGroupSurveys: groupSurveys.slice(0, 5),
    latestRfqs: rfqs.slice(0, 5),
    surveyTrend: buildMonthlySeries(surveys, "createdAt"),
    rfqTrend: buildMonthlySeries(rfqs, "createdAt"),
    userTrend: buildMonthlySeries(users, "createdAt"),
    rewardTrend: buildMonthlySeries(rewards, "created_at"),
  };
}
