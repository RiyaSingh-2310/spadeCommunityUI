import { Gift, Handshake, UserCog, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import PermissionDenied from "../../components/admin/PermissionDenied";
import TableCard from "../../components/admin/TableCard";
import { useModulePermission } from "../../modules/permissions/useModulePermission";
import { formatDashboardDate } from "../../modules/shared/utils/dateTime";
import { formatStatusLabel } from "../../modules/shared/utils/statusLabels";
import { BarsChart, DonutChart, PolylineChart, SummaryCard } from "./dashboard/dashboardCharts";
import { TABLE_HEAD } from "./dashboard/dashboardUtils";
import DashboardLoadError from "./dashboard/DashboardLoadError";
import { useDashboardData } from "./dashboard/useDashboardData";

function DashboardPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { canRead } = useModulePermission("dashboard");
  const borderRow = isDarkMode ? "border-[#263850]" : "border-[#e6edf5]";
  const headClass = "admin-text-muted";

  const {
    isSales,
    isManager,
    dashboard,
    retry,
    surveyStatus,
    rfqStatus,
    usersByCountry,
    invoiceStats,
    revenue,
    clientsOverview,
    partnersOverview,
    rewardStats,
    kpiRows,
    latestSurveys,
    latestGroupSurveys,
    latestRfqs,
    surveyTrend,
    rfqTrend,
    userTrend,
    rewardTrend,
  } = useDashboardData({ enabled: true });

  const dashboardTitle = isSales
    ? "Welcome to Sales Dashboard"
    : isManager
      ? "Welcome to Manager Dashboard"
      : "Welcome to Admin Dashboard";

  const dashboardSubtitle = isSales
    ? "Track your latest RFQs and survey projects."
    : isManager
      ? "Track your projects and group surveys."
      : "Monitor system health, growth, operations, and revenue in one place.";
  const isScopedDataLoading = dashboard.loading;
  const dashboardError = String(dashboard.error ?? "").trim();

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

      {dashboardError && !isScopedDataLoading ? (
        <DashboardLoadError message={dashboardError} onRetry={retry} />
      ) : isSales ? (
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
                  {isScopedDataLoading ? (
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
                  {isScopedDataLoading ? (
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
      ) : isManager ? (
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
            <TableCard title="Recent Projects" isDarkMode={isDarkMode}>
              <div className="overflow-x-auto">
                <table className="admin-table min-w-full text-sm">
                  <thead>
                    <tr className={headClass}>
                      {["ID", "Project Name", "Client", "Start Date", "End Date", "Status"].map((h) => (
                        <th key={h} className={TABLE_HEAD}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isScopedDataLoading ? (
                      <tr className={`border-t ${borderRow}`}>
                        <td colSpan={6} className="admin-text-muted px-3 py-6 text-center text-sm">
                          Loading...
                        </td>
                      </tr>
                    ) : latestSurveys.length === 0 ? (
                      <tr className={`border-t ${borderRow}`}>
                        <td colSpan={6} className="admin-text-muted px-3 py-6 text-center text-sm">
                          No survey records found
                        </td>
                      </tr>
                    ) : (
                      latestSurveys.map((row) => (
                        <tr key={row.recordId ?? row.id} className={`border-t ${borderRow}`}>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.id ?? "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.projectName || "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.clientName || "—"}</td>
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

            <TableCard title="Recent Group Surveys" isDarkMode={isDarkMode}>
              <div className="overflow-x-auto">
                <table className="admin-table min-w-full text-sm">
                  <thead>
                    <tr className={headClass}>
                      {["ID", "Project Name", "Status", "Created"].map((h) => (
                        <th key={h} className={TABLE_HEAD}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isScopedDataLoading ? (
                      <tr className={`border-t ${borderRow}`}>
                        <td colSpan={4} className="admin-text-muted px-3 py-6 text-center text-sm">
                          Loading...
                        </td>
                      </tr>
                    ) : latestGroupSurveys.length === 0 ? (
                      <tr className={`border-t ${borderRow}`}>
                        <td colSpan={4} className="admin-text-muted px-3 py-6 text-center text-sm">
                          No group survey records found
                        </td>
                      </tr>
                    ) : (
                      latestGroupSurveys.map((row) => (
                        <tr key={row.recordId ?? row.id} className={`border-t ${borderRow}`}>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">{row.id ?? "—"}</td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">
                            {row.projectName || row.name || "—"}
                          </td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">
                            {formatStatusLabel(row.status)}
                          </td>
                          <td className="admin-text px-3 py-3 whitespace-nowrap">
                            {formatDashboardDate(row.createdAt ?? row.created_at ?? "")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TableCard>
          </div>

          <TableCard title="Quick Actions" isDarkMode={isDarkMode}>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "View Projects", path: "/survey" },
                { label: "Add Project", path: "/survey/add" },
                { label: "Group Surveys", path: "/survey/group" },
                { label: "Settings", path: "/settings?tab=profile" },
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
        </>
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
                <SummaryCard icon={Wallet} label="Total Revenue" value={revenue.totalRevenue} />
                <SummaryCard icon={Wallet} label="Monthly Revenue" value={revenue.monthlyRevenue} />
                <SummaryCard
                  icon={Wallet}
                  label="Pending Invoice Amount"
                  value={revenue.pendingInvoiceAmount}
                />
                <SummaryCard
                  icon={Wallet}
                  label="Paid Invoice Amount"
                  value={revenue.paidInvoiceAmount}
                />
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
                <SummaryCard icon={UserCog} label="Total Clients" value={clientsOverview.total} />
                <SummaryCard icon={UserCog} label="Active Clients" value={clientsOverview.active} />
                <SummaryCard
                  icon={UserCog}
                  label="Inactive Clients"
                  value={clientsOverview.inactive}
                />
              </div>
            </TableCard>
            <TableCard title="Partner Overview" isDarkMode={isDarkMode}>
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard icon={Handshake} label="Total Partners" value={partnersOverview.total} />
                <SummaryCard
                  icon={Handshake}
                  label="Active Partners"
                  value={partnersOverview.active}
                />
                <SummaryCard
                  icon={Handshake}
                  label="Inactive Partners"
                  value={partnersOverview.inactive}
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
