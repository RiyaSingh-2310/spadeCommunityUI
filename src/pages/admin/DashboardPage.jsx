import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ClipboardList,
  FileText,
  Gift,
  Handshake,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import PermissionDenied from "../../components/admin/PermissionDenied";
import TableCard from "../../components/admin/TableCard";
import { useModulePermission } from "../../modules/permissions/useModulePermission";
import {
  isManagerLoginRole,
  isSalesLoginRole,
} from "../../services/auth/loginRole";
import { useNavigate } from "react-router-dom";
import { getRecords as getUserRecords } from "../../services/users/usersApi";
import { getRecords as getClientRecords } from "../../services/clients/clientsApi";
import { getRecords as getPartnerRecords } from "../../services/partners/partnersApi";
import { getRecords as getProjectManagerRecords } from "../../services/projectManagers/projectManagersApi";
import { getRecords as getSalesManagerRecords } from "../../services/sales/salesManagersApi";
import { getRecords as getRfqRecords } from "../../services/sales/salesProjectsApi";
import { getRecords as getSurveyRecords } from "../../modules/survey/services/surveyApi";
import { getRecords as getGroupSurveyRecords } from "../../modules/survey/services/groupSurveyApi";
import { apiRequest } from "../../services/api/client";
import { formatStatusLabel } from "../../modules/shared/utils/statusLabels";

const STATUS_ACTIVE = "active";
const TABLE_HEAD =
  "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isStatus(value, target) {
  return normalizeStatus(value) === target;
}

function toMonthKey(value) {
  const d = new Date(value ?? "");
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildLastMonths(length = 12) {
  const now = new Date();
  return Array.from({ length }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (length - idx - 1), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, { month: "short" });
    return { key, label };
  });
}

function buildMonthlySeries(rows, dateKey) {
  const months = buildLastMonths(12);
  const counts = new Map(months.map((m) => [m.key, 0]));
  rows.forEach((row) => {
    const key = toMonthKey(row?.[dateKey]);
    if (!key || !counts.has(key)) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
}

function numberFmt(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

async function fetchWithFallback(paths, fallback = { items: [], total: 0 }) {
  for (const path of paths) {
    try {
      const data = await apiRequest(path);
      const list =
        (Array.isArray(data?.data) && data.data) ||
        (Array.isArray(data?.items) && data.items) ||
        (Array.isArray(data?.records) && data.records) ||
        [];
      const total = Number(data?.total ?? data?.count ?? list.length) || list.length;
      return { items: list, total };
    } catch {
      // Try next path
    }
  }
  return fallback;
}

function PolylineChart({ data }) {
  const width = 100;
  const height = 44;
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data
    .map((item, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * width;
      const y = height - (item.value / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full">
      <polyline fill="none" stroke="var(--admin-primary-color)" strokeWidth="2.5" points={points} />
      {data.map((item, idx) => {
        const x = (idx / Math.max(data.length - 1, 1)) * width;
        const y = height - (item.value / max) * (height - 4) - 2;
        return <circle key={`${item.label}-${idx}`} cx={x} cy={y} r="1.6" fill="var(--admin-primary-color)" />;
      })}
    </svg>
  );
}

function DonutChart({ data }) {
  const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = data.map((item) => (item.value / total) * circumference);
  const offsets = segments.map((_, idx) =>
    segments.slice(0, idx).reduce((sum, current) => sum + current, 0)
  );
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-40 w-40 shrink-0">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--admin-header-search-border)" strokeWidth="14" />
        {data.map((item, idx) => (
          <circle
            key={item.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth="14"
            strokeDasharray={`${segments[idx]} ${circumference}`}
            strokeDashoffset={-offsets[idx]}
            transform="rotate(-90 60 60)"
          />
        ))}
      </svg>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="admin-text-muted">{item.label}</span>
            <span className="admin-text font-semibold">{numberFmt(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarsChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="grid grid-cols-3 gap-3 pt-3">
      {data.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="h-28 rounded-xl bg-[var(--admin-header-search-bg)] p-2">
            <div
              className="mx-auto mt-auto h-full w-8 rounded-md"
              style={{
                backgroundColor: "var(--admin-primary-color)",
                transformOrigin: "bottom",
                transform: `scaleY(${Math.max(item.value / max, 0.06)})`,
              }}
            />
          </div>
          <p className="admin-text-muted text-center text-xs">{item.label}</p>
          <p className="admin-text text-center text-sm font-semibold">{numberFmt(item.value)}</p>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-3xl border border-[var(--admin-header-surface-border)] bg-[var(--admin-header-surface)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--admin-header-search-bg)]">
          <Icon size={18} className="text-[var(--admin-primary-color)]" />
        </span>
      </div>
      <p className="admin-text-muted text-xs">{label}</p>
      <p className="admin-text mt-1 text-xl font-bold">{numberFmt(value)}</p>
    </article>
  );
}

function DashboardPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { canRead } = useModulePermission("dashboard");
  const borderRow = isDarkMode ? "border-[#263850]" : "border-[#e6edf5]";
  const headClass = "admin-text-muted";

  const isSales = isSalesLoginRole();
  const isManager = isManagerLoginRole();

  const [dashboard, setDashboard] = useState({
    loading: !isSales,
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
  });

  useEffect(() => {
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
  }, [isSales]);

  const dashboardTitle = isSales
    ? "Welcome to Sales Dashboard"
    : isManager
      ? "Welcome to Manager Dashboard"
      : "Welcome to Admin Dashboard";

  const dashboardSubtitle = isSales
    ? "Track your latest RFQs and survey projects."
    : "Monitor system health, growth, operations, and revenue in one place.";
  const isSalesDataLoading = dashboard.loading;

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

  const latestSurveys = dashboard.surveys.slice(0, 5);
  const latestRfqs = dashboard.rfqs.slice(0, 5);

  const surveyTrend = buildMonthlySeries(dashboard.surveys, "createdAt");
  const rfqTrend = buildMonthlySeries(dashboard.rfqs, "createdAt");
  const userTrend = buildMonthlySeries(dashboard.users, "createdAt");
  const rewardTrend = buildMonthlySeries(dashboard.rewards, "created_at");

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
    [
      { icon: ClipboardList, label: "Total Surveys", value: dashboard.surveys.length },
      { icon: Activity, label: "Active Surveys", value: surveyStatus.active },
      { icon: Activity, label: "Closed Surveys", value: surveyStatus.closed },
      { icon: ClipboardList, label: "Total Group Surveys", value: dashboard.groupSurveys.length },
    ],
    [
      { icon: FileText, label: "Total RFQs", value: dashboard.rfqs.length },
      { icon: FileText, label: "Won RFQs", value: rfqStatus.won },
      { icon: FileText, label: "Lost RFQs", value: rfqStatus.lost },
      { icon: FileText, label: "Pending RFQs", value: rfqStatus.pending },
    ],
    [
      { icon: Gift, label: "Pending Rewards", value: rewardStats.pending },
      { icon: Gift, label: "Completed Rewards", value: rewardStats.completed },
      { icon: Wallet, label: "Total Invoices", value: invoiceStats.total },
      { icon: Users, label: "Active Sales Managers", value: dashboard.salesManagers.filter((s) => isStatus(s.status, STATUS_ACTIVE)).length },
    ],
  ];

  if (!canRead) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={dashboardTitle}
        subtitle={dashboardSubtitle}
        isDarkMode={isDarkMode}
      />

      {isSales ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard title="Latest RFQs" isDarkMode={isDarkMode}>
            <div className="overflow-x-auto">
              <table className="admin-table min-w-full text-sm">
                <thead>
                  <tr className={headClass}>
                    {["ID", "Client Name", "Email Address", "Country", "Status"].map((h) => (
                      <th key={h} className={TABLE_HEAD}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isSalesDataLoading ? (
                    <tr className={`border-t ${borderRow}`}>
                      <td colSpan={5} className="admin-text-muted px-3 py-6 text-center text-sm">
                        Loading...
                      </td>
                    </tr>
                  ) : latestRfqs.length === 0 ? (
                    <tr className={`border-t ${borderRow}`}>
                      <td colSpan={5} className="admin-text-muted px-3 py-6 text-center text-sm">
                        No RFQ records found
                      </td>
                    </tr>
                  ) : (
                    latestRfqs.map((row) => (
                      <tr key={row.recordId ?? row.id} className={`border-t ${borderRow}`}>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">{row.id ?? "—"}</td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">{row.name || "—"}</td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">
                          {row.emailAddress || "—"}
                        </td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">
                          {row.country || "—"}
                        </td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">
                          {formatStatusLabel(row.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TableCard>

          <TableCard title="Latest Surveys" isDarkMode={isDarkMode}>
            <div className="overflow-x-auto">
              <table className="admin-table min-w-full text-sm">
                <thead>
                  <tr className={headClass}>
                    {["ID", "Name", "Start Date", "End Date", "Status"].map((h) => (
                      <th key={h} className={TABLE_HEAD}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isSalesDataLoading ? (
                    <tr className={`border-t ${borderRow}`}>
                      <td colSpan={5} className="admin-text-muted px-3 py-6 text-center text-sm">
                        Loading...
                      </td>
                    </tr>
                  ) : latestSurveys.length === 0 ? (
                    <tr className={`border-t ${borderRow}`}>
                      <td colSpan={5} className="admin-text-muted px-3 py-6 text-center text-sm">
                        No survey records found
                      </td>
                    </tr>
                  ) : (
                    latestSurveys.map((row) => (
                      <tr key={row.recordId ?? row.id} className={`border-t ${borderRow}`}>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">{row.id ?? "—"}</td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">
                          {row.projectName || "—"}
                        </td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">
                          {row.startDate || "—"}
                        </td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">
                          {row.endDate || "—"}
                        </td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">
                          {formatStatusLabel(row.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TableCard>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {kpiRows.map((row, idx) => (
              <div key={idx} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {row.map((card) => (
                  <SummaryCard key={card.label} icon={card.icon} label={card.label} value={card.value} />
                ))}
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="Survey Status Distribution" isDarkMode={isDarkMode}>
              <DonutChart
                data={[
                  { label: "Active", value: surveyStatus.active, color: "#10a950" },
                  { label: "Closed", value: surveyStatus.closed, color: "#0e7f3f" },
                  { label: "Draft", value: surveyStatus.draft, color: "#50cf8a" },
                  { label: "Paused", value: surveyStatus.paused, color: "#8ce9b6" },
                ]}
              />
            </TableCard>
            <TableCard title="Survey Trend (Last 12 Months)" isDarkMode={isDarkMode}>
              <PolylineChart data={surveyTrend} />
            </TableCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="RFQ Status Overview" isDarkMode={isDarkMode}>
              <BarsChart
                data={[
                  { label: "Won", value: rfqStatus.won },
                  { label: "Lost", value: rfqStatus.lost },
                  { label: "Pending", value: rfqStatus.pending },
                ]}
              />
            </TableCard>
            <TableCard title="RFQ Trend (Last 12 Months)" isDarkMode={isDarkMode}>
              <PolylineChart data={rfqTrend} />
            </TableCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="User Growth (Last 12 Months)" isDarkMode={isDarkMode}>
              <PolylineChart data={userTrend} />
            </TableCard>
            <TableCard title="User Distribution by Country" isDarkMode={isDarkMode}>
              <DonutChart data={usersByCountry} />
            </TableCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="Revenue Summary" isDarkMode={isDarkMode}>
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryCard
                  icon={Wallet}
                  label="Total Revenue"
                  value={invoiceStats.paidAmount + invoiceStats.pendingAmount}
                />
                <SummaryCard icon={Wallet} label="Monthly Revenue" value={invoiceStats.paidAmount} />
                <SummaryCard icon={Wallet} label="Pending Invoice Amount" value={invoiceStats.pendingAmount} />
                <SummaryCard icon={Wallet} label="Paid Invoice Amount" value={invoiceStats.paidAmount} />
              </div>
            </TableCard>
            <TableCard title="Invoice Status Distribution" isDarkMode={isDarkMode}>
              <DonutChart
                data={[
                  { label: "Paid", value: invoiceStats.paid, color: "#10a950" },
                  { label: "Pending", value: invoiceStats.pending, color: "#3ecf7f" },
                  { label: "Overdue", value: invoiceStats.overdue, color: "#0f6a34" },
                ]}
              />
            </TableCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="Client Overview" isDarkMode={isDarkMode}>
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard icon={UserCog} label="Total Clients" value={dashboard.clients.length} />
                <SummaryCard
                  icon={UserCog}
                  label="Active Clients"
                  value={dashboard.clients.filter((c) => isStatus(c.status, STATUS_ACTIVE)).length}
                />
                <SummaryCard
                  icon={UserCog}
                  label="Inactive Clients"
                  value={dashboard.clients.filter((c) => !isStatus(c.status, STATUS_ACTIVE)).length}
                />
              </div>
            </TableCard>
            <TableCard title="Partner Overview" isDarkMode={isDarkMode}>
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard icon={Handshake} label="Total Partners" value={dashboard.partners.length} />
                <SummaryCard
                  icon={Handshake}
                  label="Active Partners"
                  value={dashboard.partners.filter((p) => isStatus(p.status, STATUS_ACTIVE)).length}
                />
                <SummaryCard
                  icon={Handshake}
                  label="Inactive Partners"
                  value={dashboard.partners.filter((p) => !isStatus(p.status, STATUS_ACTIVE)).length}
                />
              </div>
            </TableCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="Reward Statistics" isDarkMode={isDarkMode}>
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryCard icon={Gift} label="Pending Rewards" value={rewardStats.pending} />
                <SummaryCard icon={Gift} label="Completed Rewards" value={rewardStats.completed} />
                <SummaryCard icon={Gift} label="Total Redeemed Points" value={rewardStats.redeemedPoints} />
                <SummaryCard icon={Gift} label="Total Reward Requests" value={rewardStats.totalRequests} />
              </div>
            </TableCard>
            <TableCard title="Reward Redemption Trend" isDarkMode={isDarkMode}>
              <PolylineChart data={rewardTrend} />
            </TableCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="Recent Surveys" isDarkMode={isDarkMode}>
              <div className="overflow-x-auto">
                <table className="admin-table min-w-full text-sm">
                  <thead>
                    <tr className={headClass}>
                      {["ID", "Project Name", "Client", "Project Manager", "Start Date", "End Date", "Status"].map((h) => (
                        <th key={h} className={TABLE_HEAD}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {latestSurveys.length === 0 ? (
                      <tr className={`border-t ${borderRow}`}>
                        <td colSpan={7} className="admin-text-muted px-3 py-6 text-center text-sm">
                          No survey records found
                        </td>
                      </tr>
                    ) : (
                      latestSurveys.map((row) => (
                        <tr key={row.recordId ?? row.id} className={`border-t ${borderRow}`}>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.id ?? "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.projectName || "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.clientName || "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.projectManagerName || "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.startDate || "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.endDate || "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{formatStatusLabel(row.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TableCard>

            <TableCard title="Recent RFQs" isDarkMode={isDarkMode}>
              <div className="overflow-x-auto">
                <table className="admin-table min-w-full text-sm">
                  <thead>
                    <tr className={headClass}>
                      {["ID", "Client Name", "Country", "Email Subject", "Status", "Sales Manager"].map((h) => (
                        <th key={h} className={TABLE_HEAD}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {latestRfqs.length === 0 ? (
                      <tr className={`border-t ${borderRow}`}>
                        <td colSpan={6} className="admin-text-muted px-3 py-6 text-center text-sm">
                          No RFQ records found
                        </td>
                      </tr>
                    ) : (
                      latestRfqs.map((row) => (
                        <tr key={row.recordId ?? row.id} className={`border-t ${borderRow}`}>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.id ?? "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.name || "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.country || "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.emailSubject || "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{formatStatusLabel(row.status)}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.salesManager || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TableCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="Recent Activity" isDarkMode={isDarkMode}>
              <div className="space-y-2">
                {(dashboard.logs.slice(0, 10) ?? []).map((log, idx) => {
                  const createdAt = log.created_at ?? log.createdAt ?? "";
                  const d = new Date(createdAt);
                  return (
                    <div key={`${log.id ?? idx}-${idx}`} className="flex items-center justify-between rounded-xl border border-(--admin-header-search-border) px-3 py-2">
                      <div>
                        <p className="admin-text text-sm font-semibold">{log.activity ?? log.action ?? "Activity"}</p>
                        <p className="admin-text-muted text-xs">{log.user ?? log.name ?? log.created_by ?? "System"}</p>
                      </div>
                      <div className="text-right">
                        <p className="admin-text-muted text-xs">
                          {Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString()}
                        </p>
                        <p className="admin-text-muted text-xs">
                          {Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {dashboard.logs.length === 0 && (
                  <p className="admin-text-muted py-8 text-center text-sm">No recent activity found</p>
                )}
              </div>
            </TableCard>
            <TableCard title="Quick Actions" isDarkMode={isDarkMode}>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Add Client", path: "/clients/add" },
                  { label: "Add Partner", path: "/partners/add" },
                  { label: "Add Survey", path: "/survey/add" },
                  { label: "Add RFQ", path: "/rfq/add" },
                  { label: "Add User", path: "/users/add" },
                  { label: "Generate Invoice", path: "/invoice/list" },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="rounded-xl border border-(--admin-header-surface-border) bg-(--admin-header-search-bg) px-4 py-3 text-left text-sm font-semibold admin-text transition hover:opacity-90"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </TableCard>
          </div>

          {dashboard.loading && (
            <p className="admin-text-muted text-center text-sm">
              Loading dashboard analytics...
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardPage;
