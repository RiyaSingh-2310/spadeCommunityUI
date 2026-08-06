import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Handshake, UserCog, Users } from "lucide-react";
import {
  isManagerLoginRole,
  isSalesLoginRole,
} from "../../../services/auth/loginRole";
import { getDashboardSummary } from "../../../services/dashboard/dashboardApi";
import { getRecords as getRfqRecords } from "../../../services/sales/salesProjectsApi";
import { getRecords as getSurveyRecords } from "../../../modules/survey/services/surveyApi";
import { getRecords as getGroupSurveyRecords } from "../../../modules/survey/services/groupSurveyApi";
import { MAX_API_LIST_LIMIT } from "../../../modules/shared/utils/listQueryParams";
import { buildMonthlySeries, normalizeStatus } from "./dashboardUtils";

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

const EMPTY_SUMMARY = {
  totals: {
    totalUsers: 0,
    totalClients: 0,
    totalPartners: 0,
    totalProjectManagers: 0,
  },
  surveyStatus: { active: 0, closed: 0, draft: 0, paused: 0 },
  surveyTrend: [],
  rfqStatus: { won: 0, lost: 0, pending: 0 },
  rfqTrend: [],
  userTrend: [],
  usersByCountry: [],
  revenue: {
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingInvoiceAmount: 0,
    paidInvoiceAmount: 0,
  },
  invoiceStats: {
    paid: 0,
    pending: 0,
    overdue: 0,
    paidAmount: 0,
    pendingAmount: 0,
  },
  clientsOverview: { total: 0, active: 0, inactive: 0 },
  partnersOverview: { total: 0, active: 0, inactive: 0 },
  rewardStats: {
    pending: 0,
    completed: 0,
    redeemedPoints: 0,
    totalRequests: 0,
  },
  rewardTrend: [],
};

export function useDashboardData({ enabled = true } = {}) {
  const isSales = isSalesLoginRole();
  const isManager = isManagerLoginRole();
  const [dashboard, setDashboard] = useState({
    ...EMPTY_DASHBOARD,
    loading: Boolean(enabled),
  });
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

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
          setSummary(EMPTY_SUMMARY);
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
          setSummary(EMPTY_SUMMARY);
          setDashboard({
            ...EMPTY_DASHBOARD,
            loading: false,
            surveys: asArray(surveyData.items),
            groupSurveys: asArray(groupSurveyData.items),
          });
          return;
        }

        const summaryData = await getDashboardSummary();

        if (cancelled) return;
        setSummary(summaryData);
        setDashboard({
          ...EMPTY_DASHBOARD,
          loading: false,
        });
      } catch {
        if (cancelled) return;
        setSummary(EMPTY_SUMMARY);
        setDashboard((prev) => ({ ...prev, loading: false }));
      }
    };
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [enabled, isSales, isManager]);

  const surveyStatus = useMemo(() => {
    if (!isSales && !isManager) return summary.surveyStatus;

    const result = { active: 0, closed: 0, draft: 0, paused: 0 };
    asArray(dashboard.surveys).forEach((s) => {
      const st = normalizeStatus(s.status);
      if (st.includes("active")) result.active += 1;
      else if (st.includes("closed")) result.closed += 1;
      else if (st.includes("draft")) result.draft += 1;
      else if (st.includes("pause")) result.paused += 1;
    });
    return result;
  }, [dashboard.surveys, isManager, isSales, summary.surveyStatus]);

  const rfqStatus = useMemo(() => {
    if (!isSales && !isManager) return summary.rfqStatus;

    const result = { won: 0, lost: 0, pending: 0 };
    asArray(dashboard.rfqs).forEach((rfq) => {
      const st = normalizeStatus(rfq.status);
      if (st === "won") result.won += 1;
      else if (st === "lost") result.lost += 1;
      else result.pending += 1;
    });
    return result;
  }, [dashboard.rfqs, isManager, isSales, summary.rfqStatus]);

  const usersByCountry = useMemo(() => {
    if (!isSales && !isManager) return summary.usersByCountry;
    return [];
  }, [isManager, isSales, summary.usersByCountry]);

  const invoiceStats = useMemo(() => {
    if (!isSales && !isManager) return summary.invoiceStats;
    return EMPTY_SUMMARY.invoiceStats;
  }, [isManager, isSales, summary.invoiceStats]);

  const rewardStats = useMemo(() => {
    if (!isSales && !isManager) return summary.rewardStats;
    return EMPTY_SUMMARY.rewardStats;
  }, [isManager, isSales, summary.rewardStats]);

  const surveys = asArray(dashboard.surveys);
  const groupSurveys = asArray(dashboard.groupSurveys);
  const rfqs = asArray(dashboard.rfqs);

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
          {
            icon: Users,
            label: "Total Users",
            value: summary.totals.totalUsers,
          },
          {
            icon: UserCog,
            label: "Total Clients",
            value: summary.totals.totalClients,
          },
          {
            icon: Handshake,
            label: "Total Partners",
            value: summary.totals.totalPartners,
          },
          {
            icon: ClipboardList,
            label: "Total Project Managers",
            value: summary.totals.totalProjectManagers,
          },
        ],
      ];

  const surveyTrend =
    !isSales && !isManager
      ? summary.surveyTrend
      : buildMonthlySeries(surveys, "createdAt");
  const rfqTrend =
    !isSales && !isManager
      ? summary.rfqTrend
      : buildMonthlySeries(rfqs, "createdAt");
  const userTrend = !isSales && !isManager ? summary.userTrend : [];
  const rewardTrend = !isSales && !isManager ? summary.rewardTrend : [];

  return {
    isSales,
    isManager,
    dashboard: {
      ...dashboard,
      users: asArray(dashboard.users),
      clients: asArray(dashboard.clients),
      partners: asArray(dashboard.partners),
      projectManagers: asArray(dashboard.projectManagers),
      surveys,
      groupSurveys,
      rfqs,
      rewards: asArray(dashboard.rewards),
      invoices: asArray(dashboard.invoices),
      logs: asArray(dashboard.logs),
    },
    surveyStatus,
    rfqStatus,
    usersByCountry,
    invoiceStats,
    revenue: summary.revenue,
    clientsOverview: summary.clientsOverview,
    partnersOverview: summary.partnersOverview,
    rewardStats,
    kpiRows,
    latestSurveys: surveys.slice(0, 5),
    latestGroupSurveys: groupSurveys.slice(0, 5),
    latestRfqs: rfqs.slice(0, 5),
    surveyTrend,
    rfqTrend,
    userTrend,
    rewardTrend,
  };
}
