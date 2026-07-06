import { Gift, Handshake, UserCog, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import PermissionDenied from "../../components/admin/PermissionDenied";
import TableCard from "../../components/admin/TableCard";
import { useModulePermission } from "../../modules/permissions/useModulePermission";
import { isManagerLoginRole } from "../../services/auth/loginRole";
import { formatDashboardDate, formatDashboardTime } from "../../modules/shared/utils/dateTime";
import { formatStatusLabel } from "../../modules/shared/utils/statusLabels";
import { BarsChart, DonutChart, PolylineChart, SummaryCard } from "./dashboard/dashboardCharts";
import { isStatus, STATUS_ACTIVE, TABLE_HEAD } from "./dashboard/dashboardUtils";
import { useDashboardData } from "./dashboard/useDashboardData";

function DashboardPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { canRead } = useModulePermission("dashboard");
  const borderRow = isDarkMode ? "border-[#263850]" : "border-[#e6edf5]";
  const headClass = "admin-text-muted";
  const isManager = isManagerLoginRole();

  const {
    isSales,
    dashboard,
    surveyStatus,
    rfqStatus,
    usersByCountry,
    invoiceStats,
    rewardStats,
    kpiRows,
    latestSurveys,
    latestRfqs,
    surveyTrend,
    rfqTrend,
    userTrend,
    rewardTrend,
  } = useDashboardData();

  const dashboardTitle = isSales
    ? "Welcome to Sales Dashboard"
    : isManager
      ? "Welcome to Manager Dashboard"
      : "Welcome to Admin Dashboard";

  const dashboardSubtitle = isSales
    ? "Track your latest RFQs and survey projects."
    : "Monitor system health, growth, operations, and revenue in one place.";
  const isSalesDataLoading = dashboard.loading;

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

      <Link
        to="/survey-research"
        className={`block rounded-2xl border px-5 py-4 transition hover:shadow-md ${
          isDarkMode
            ? "border-indigo-500/30 bg-indigo-500/10 hover:border-indigo-400/50"
            : "border-indigo-200 bg-indigo-50 hover:border-indigo-300"
        }`}
      >
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
          Survey Research Portal
        </p>
        <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
          Open the enterprise survey management demo — pre-screeners, projects, and analytics.
        </p>
      </Link>

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
                  return (
                    <div key={`${log.id ?? idx}-${idx}`} className="flex items-center justify-between rounded-xl border border-(--admin-header-search-border) px-3 py-2">
                      <div>
                        <p className="admin-text text-sm font-semibold">{log.activity ?? log.action ?? "Activity"}</p>
                        <p className="admin-text-muted text-xs">{log.user ?? log.name ?? log.created_by ?? "System"}</p>
                      </div>
                      <div className="text-right">
                        <p className="admin-text-muted text-xs">
                          {formatDashboardDate(createdAt)}
                        </p>
                        <p className="admin-text-muted text-xs">
                          {formatDashboardTime(createdAt)}
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
