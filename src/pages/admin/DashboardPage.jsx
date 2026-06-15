import { useEffect, useState } from "react";
import { ArrowUpRight, ClipboardList, Handshake, UserCog, Users } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import PermissionDenied from "../../components/admin/PermissionDenied";
import TableCard from "../../components/admin/TableCard";
import { useModulePermission } from "../../modules/permissions/useModulePermission";
import {
  isAdminLoginRole,
  isManagerLoginRole,
  isSalesLoginRole,
} from "../../services/auth/loginRole";
import { getRecords as getRfqRecords } from "../../services/sales/salesProjectsApi";
import { getRecords as getSurveyRecords } from "../../modules/survey/services/surveyApi";
import { formatStatusLabel } from "../../modules/shared/utils/statusLabels";

const stats = [
  { icon: Users, label: "Users", count: 128, growth: "+12%" },
  { icon: UserCog, label: "Clients", count: 64, growth: "+8%" },
  { icon: Handshake, label: "Partners", count: 34, growth: "+5%" },
  { icon: ClipboardList, label: "Project Managers", count: 19, growth: "+3%" },
];

const surveyRows = Array.from({ length: 3 }).map((_, idx) => ({
  id: `SRV-${1000 + idx}`,
  name: `Survey ${idx + 1}`,
  start: "2026-06-01",
  end: "2026-06-30",
  status: idx % 2 === 0 ? "Active" : "Inactive",
}));

const liveRows = Array.from({ length: 3 }).map((_, idx) => ({
  id: `LGS-${300 + idx}`,
  name: `Group Survey ${idx + 1}`,
  status: idx % 2 === 0 ? "Active" : "Inactive",
}));

const TABLE_HEAD =
  "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

function DashboardPage({ isDarkMode }) {
  const { canRead, canWrite } = useModulePermission("dashboard");
  const borderRow = isDarkMode ? "border-[#263850]" : "border-[#e6edf5]";
  const headClass = "admin-text-muted";

  const isSales = isSalesLoginRole();
  const isManager = isManagerLoginRole();
  const isAdmin = isAdminLoginRole();

  const [latestRfqs, setLatestRfqs] = useState([]);
  const [latestSurveys, setLatestSurveys] = useState([]);
  const [isSalesDataLoading, setIsSalesDataLoading] = useState(isSales);

  useEffect(() => {
    if (!isSales) return undefined;

    let cancelled = false;

    const loadSalesDashboard = async () => {
      setIsSalesDataLoading(true);
      try {
        const [rfqData, surveyData] = await Promise.all([
          getRfqRecords({ page: 1, limit: 5 }),
          getSurveyRecords({ page: 1, limit: 5 }),
        ]);
        if (cancelled) return;
        setLatestRfqs(rfqData.items ?? []);
        setLatestSurveys(surveyData.items ?? []);
      } catch {
        if (!cancelled) {
          setLatestRfqs([]);
          setLatestSurveys([]);
        }
      } finally {
        if (!cancelled) setIsSalesDataLoading(false);
      }
    };

    loadSalesDashboard();
    return () => {
      cancelled = true;
    };
  }, [isSales]);

  if (!canRead) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  const dashboardTitle = isSales
    ? "Welcome to Sales Dashboard"
    : isManager
      ? "Welcome to Manager Dashboard"
      : "Welcome to Admin Dashboard";

  const dashboardSubtitle = isSales
    ? "Track your latest RFQs and survey projects."
    : "Manage your platform from a centralized dashboard.";

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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <article
                key={item.label}
                className={`rounded-3xl border p-4 transition-all duration-300 ${
                  isDarkMode
                    ? "border-[#283b58] bg-[#131f31] shadow-[0_12px_28px_rgba(2,6,23,0.3)]"
                    : "border-[#dce7f3] bg-white shadow-[0_8px_20px_rgba(17,36,65,0.08)]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                      isDarkMode ? "bg-[#1a273c]" : "bg-[#eef4fb]"
                    }`}
                  >
                    <item.icon size={20} className="text-[var(--admin-success-text)]" />
                  </span>
                  {canWrite && isAdmin && (
                    <span className="admin-text-subtle flex items-center gap-1 text-xs font-semibold">
                      {item.growth}
                      <ArrowUpRight size={14} />
                    </span>
                  )}
                </div>
                <p className="admin-text-muted text-sm">{item.label}</p>
                <p className="admin-text mt-1 text-2xl font-bold">{item.count}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="Survey Overview" isDarkMode={isDarkMode}>
              <div className="overflow-x-auto">
                <table className="admin-table min-w-full text-sm">
                  <thead>
                    <tr className={headClass}>
                      {["ID", "Name", "Start", "End", "Status"].map((h) => (
                        <th key={h} className={TABLE_HEAD}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {surveyRows.map((row) => (
                      <tr key={row.id} className={`border-t ${borderRow}`}>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">{row.id}</td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">{row.name}</td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">{row.start}</td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">{row.end}</td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">
                          {formatStatusLabel(row.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableCard>

            <TableCard title="Live Group Surveys" isDarkMode={isDarkMode}>
              <div className="overflow-x-auto">
                <table className="admin-table min-w-full text-sm">
                  <thead>
                    <tr className={headClass}>
                      {["ID", "Name", "Status"].map((h) => (
                        <th key={h} className={TABLE_HEAD}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liveRows.map((row) => (
                      <tr key={row.id} className={`border-t ${borderRow}`}>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">{row.id}</td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">{row.name}</td>
                        <td className="admin-text px-3 py-3 whitespace-nowrap">
                          {formatStatusLabel(row.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableCard>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
