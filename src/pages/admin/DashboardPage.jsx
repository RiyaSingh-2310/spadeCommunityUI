import { FolderKanban, Gift, Handshake, Link2, UserCog, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import PermissionDenied from "../../components/admin/PermissionDenied";
import TableCard from "../../components/admin/TableCard";
import { useModulePermission } from "../../modules/permissions/useModulePermission";
import { usePermissions } from "../../modules/permissions/PermissionsContext";
import { canAccessRewardManagement } from "../../modules/permissions/permissionsUtils";
import {
  isAdminLoginRole,
  isPartnerLoginRole,
} from "../../services/auth/loginRole";
import { formatDashboardDate } from "../../modules/shared/utils/dateTime";
import { formatStatusLabel } from "../../modules/shared/utils/statusLabels";
import { BarsChart, DonutChart, HorizontalBarsChart, PolylineChart, SummaryCard } from "./dashboard/dashboardCharts";
import { TABLE_HEAD, dashboardCount } from "./dashboard/dashboardUtils";
import DashboardLoadError from "./dashboard/DashboardLoadError";
import PanelistAnalyticsDashboard from "./dashboard/PanelistAnalyticsDashboard";
import { useDashboardData } from "./dashboard/useDashboardData";
import { usePartnerDashboardData } from "./dashboard/usePartnerDashboardData";

/** Admin View top KPI cards → existing app routes (sidebar roots). */
const ADMIN_VIEW_KPI_ROUTES = Object.freeze({
  "Total Users": "/community-users",
  "Total Clients": "/clients",
  "Total Partners": "/partners",
  "Total Project Managers": "/project-managers",
  "Total Projects": "/survey",
});
function DashboardPage({ isDarkMode }) {
  const navigate = useNavigate();
  const isPartner = isPartnerLoginRole();
  const isAdmin = isAdminLoginRole();
  const [adminSurface, setAdminSurface] = useState("admin");
  const { canRead } = useModulePermission("dashboard");
  const { permissions, canRead: canReadModule, canWrite } = usePermissions();
  const showRewardWidgets = canAccessRewardManagement(permissions);
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
  } = useDashboardData({ enabled: !isPartner });
  const partnerDashboard = usePartnerDashboardData({ enabled: isPartner });

  const dashboardTitle = isSales
    ? "Welcome to Sales Dashboard"
    : isManager
      ? "Welcome to Manager Dashboard"
      : isPartner
        ? "Welcome to Partner Dashboard"
        : "Welcome to Admin Dashboard";

  const dashboardSubtitle = isSales
    ? "Track your latest RFQs and survey projects."
    : isManager
      ? "Track your projects and group surveys."
      : isPartner
        ? "Review the projects assigned to your partner account."
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
        rightContent={
          isAdmin ? (
            <div
              className="flex rounded-xl border p-1"
              style={{ borderColor: "var(--admin-header-surface-border)" }}
              role="tablist"
              aria-label="Dashboard view"
            >
              {[
                { id: "admin", label: "Admin View" },
                { id: "panelist", label: "Panelist View" },
              ].map((option) => {
                const isActive = adminSurface === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setAdminSurface(option.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#10a950] text-white"
                        : "admin-text-muted hover:bg-[var(--admin-permissions-row-hover)]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null
        }
      />

      {isAdmin && adminSurface === "panelist" ? (
        <PanelistAnalyticsDashboard isDarkMode={isDarkMode} />
      ) : isPartner ? (
        partnerDashboard.error && !partnerDashboard.loading ? (
          <DashboardLoadError
            message={partnerDashboard.error}
            onRetry={partnerDashboard.retry}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryCard
                icon={FolderKanban}
                label="Assigned Projects"
                value={partnerDashboard.projectCount}
              />
              <SummaryCard
                icon={Link2}
                label="Active Mappings"
                value={partnerDashboard.activeCount}
              />
              <SummaryCard
                icon={Link2}
                label="Inactive Mappings"
                value={partnerDashboard.inactiveCount}
              />
              {partnerDashboard.totalQuota != null ? (
                <SummaryCard
                  icon={Wallet}
                  label="Total Partner Quota"
                  value={partnerDashboard.totalQuota}
                />
              ) : null}
              {partnerDashboard.usedQuota != null ? (
                <SummaryCard
                  icon={Wallet}
                  label="Used Quota"
                  value={partnerDashboard.usedQuota}
                />
              ) : null}
              {partnerDashboard.remainingQuota != null ? (
                <SummaryCard
                  icon={Wallet}
                  label="Remaining Quota"
                  value={partnerDashboard.remainingQuota}
                />
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <TableCard title="Mapping Status" isDarkMode={isDarkMode}>
                {partnerDashboard.loading ? (
                  <p className="admin-text-muted text-sm">Loading...</p>
                ) : partnerDashboard.statusSeries.length === 0 ? (
                  <p className="admin-text-muted text-sm">No mapping status data yet.</p>
                ) : (
                  <DonutChart data={partnerDashboard.statusSeries} />
                )}
              </TableCard>
              <TableCard title="Quota by Project" isDarkMode={isDarkMode}>
                {partnerDashboard.loading ? (
                  <p className="admin-text-muted text-sm">Loading...</p>
                ) : partnerDashboard.quotaByProject.length === 0 ? (
                  <p className="admin-text-muted text-sm">No quota data available yet.</p>
                ) : (
                  <HorizontalBarsChart data={partnerDashboard.quotaByProject} />
                )}
              </TableCard>
            </div>

            <TableCard title="Assigned Projects" isDarkMode={isDarkMode}>
              <div className="overflow-x-auto">
                <table className="admin-table min-w-full text-sm">
                  <thead>
                    <tr className={headClass}>
                      {["Project", "Partner Code", "Quota", "CPI", "Status", "Action"].map((h) => (
                        <th key={h} className={TABLE_HEAD}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {partnerDashboard.loading ? (
                      <tr className={`border-t ${borderRow}`}>
                        <td colSpan={6} className="admin-text-muted px-3 py-6 text-center text-sm">
                          Loading...
                        </td>
                      </tr>
                    ) : partnerDashboard.recentRows.length === 0 ? (
                      <tr className={`border-t ${borderRow}`}>
                        <td colSpan={6} className="admin-text-muted px-3 py-6 text-center text-sm">
                          No assigned projects found
                        </td>
                      </tr>
                    ) : (
                      partnerDashboard.recentRows.map((row) => (
                        <tr key={row.id} className={`border-t ${borderRow}`}>
                          <td className="admin-text whitespace-nowrap px-3 py-3">
                            {row.projectName || row.projectId || "—"}
                          </td>
                          <td className="admin-text whitespace-nowrap px-3 py-3">
                            {row.partnerCode}
                          </td>
                          <td className="admin-text whitespace-nowrap px-3 py-3">{row.quota}</td>
                          <td className="admin-text whitespace-nowrap px-3 py-3">{row.cpi}</td>
                          <td className="admin-text whitespace-nowrap px-3 py-3">
                            {formatStatusLabel(row.statusActive ? "Active" : "Inactive")}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              className="text-sm font-semibold text-[#10a950] hover:underline"
                              disabled={!row.projectId}
                              onClick={() =>
                                navigate(`/survey/view/${encodeURIComponent(row.projectId)}`)
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TableCard>
          </div>
        )
      ) : dashboardError && !isScopedDataLoading ? (
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
                  { label: "Active", value: dashboardCount(surveyStatus.active), color: "#10a950" },
                  { label: "Closed", value: dashboardCount(surveyStatus.closed), color: "#0e7f3f" },
                  { label: "Draft", value: dashboardCount(surveyStatus.draft), color: "#50cf8a" },
                  { label: "Paused", value: dashboardCount(surveyStatus.paused), color: "#8ce9b6" },
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
                { label: "View Projects", path: "/survey", show: canReadModule("survey") },
                {
                  label: "Add Project",
                  path: "/survey/add",
                  show: canWrite("survey"),
                },
                {
                  label: "Group Surveys",
                  path: "/survey/group",
                  show: canReadModule("group_survey"),
                },
                { label: "Settings", path: "/settings?tab=profile", show: true },
              ]
                .filter((action) => action.show)
                .map((action) => (
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
                {row.map((card) => {
                  const path = ADMIN_VIEW_KPI_ROUTES[card.label];
                  return (
                    <SummaryCard
                      key={card.label}
                      icon={card.icon}
                      label={card.label}
                      value={card.value}
                      onClick={path ? () => navigate(path) : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="Survey Status Distribution" isDarkMode={isDarkMode}>
              <DonutChart
                data={[
                  { label: "Active", value: dashboardCount(surveyStatus.active), color: "#10a950" },
                  { label: "Closed", value: dashboardCount(surveyStatus.closed), color: "#0e7f3f" },
                  { label: "Draft", value: dashboardCount(surveyStatus.draft), color: "#50cf8a" },
                  { label: "Paused", value: dashboardCount(surveyStatus.paused), color: "#8ce9b6" },
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
                  { label: "Won", value: dashboardCount(rfqStatus?.won) },
                  { label: "Lost", value: dashboardCount(rfqStatus?.lost) },
                  { label: "Pending", value: dashboardCount(rfqStatus?.pending) },
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
                  { label: "Paid", value: dashboardCount(invoiceStats.paid), color: "#10a950" },
                  { label: "Pending", value: dashboardCount(invoiceStats.pending), color: "#3ecf7f" },
                  { label: "Overdue", value: dashboardCount(invoiceStats.overdue), color: "#0f6a34" },
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

          {showRewardWidgets ? (
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
          ) : null}

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
