import { useEffect, useState } from "react";
import { ClipboardList, Wallet } from "lucide-react";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import Avatar from "../../../components/shared/Avatar";
import { formatDashboardDate } from "../../../modules/shared/utils/dateTime";
import { toastApiError } from "../../../services/toast/apiToast";
import { fetchPanelistDashboard } from "../../../services/panelist-portal/panelistPortalApi";

function ProfileRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="admin-text-muted shrink-0">{label}</dt>
      <dd className="admin-text text-right break-all">{value || "—"}</dd>
    </div>
  );
}

function PanelistDashboard({ isDarkMode }) {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchPanelistDashboard();
        if (!cancelled) {
          setDashboard(data);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboard(null);
          toastApiError(error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const memberSinceLabel = dashboard?.memberSince
    ? formatDashboardDate(dashboard.memberSince)
    : "—";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Welcome to Panelist Dashboard"
        subtitle="View your profile and reward activity."
        isDarkMode={isDarkMode}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TableCard title="Reward Balance" isDarkMode={isDarkMode}>
            <div className="h-10 w-28 animate-pulse rounded-lg bg-[var(--admin-skeleton-bg)]" />
            <div className="mt-3 h-4 w-48 animate-pulse rounded bg-[var(--admin-skeleton-bg)]" />
          </TableCard>
          <TableCard title="Questionnaire" isDarkMode={isDarkMode}>
            <div className="h-8 w-32 animate-pulse rounded-lg bg-[var(--admin-skeleton-bg)]" />
            <div className="mt-3 h-4 w-56 animate-pulse rounded bg-[var(--admin-skeleton-bg)]" />
          </TableCard>
          <TableCard title="Basic Profile" isDarkMode={isDarkMode}>
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-[var(--admin-skeleton-bg)]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--admin-skeleton-bg)]" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--admin-skeleton-bg)]" />
            </div>
          </TableCard>
        </div>
      ) : null}

      {!isLoading && !dashboard ? (
        <TableCard title="Dashboard" isDarkMode={isDarkMode}>
          <p className="admin-text-muted text-sm">
            Unable to load your panelist dashboard right now. Please try again.
          </p>
        </TableCard>
      ) : null}

      {!isLoading && dashboard ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <TableCard title="Reward Balance" isDarkMode={isDarkMode}>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: "var(--admin-summary-icon-bg)",
                    color: "var(--admin-primary-color)",
                  }}
                >
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-4xl font-bold admin-text tabular-nums">
                    {dashboard.balancePointLabel}
                  </p>
                  <p className="admin-text-muted mt-1 text-sm">Available reward points</p>
                </div>
              </div>
            </TableCard>

            <TableCard title="Questionnaire" isDarkMode={isDarkMode}>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: "var(--admin-summary-icon-bg)",
                    color: "var(--admin-primary-color)",
                  }}
                >
                  <ClipboardList size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold admin-text">
                    {dashboard.questionnaireLabel}
                  </p>
                  <p className="admin-text-muted mt-1 text-sm">
                    {dashboard.questionnaireCompleted
                      ? "Your profiling questionnaire is complete."
                      : "Complete your profiling questionnaire when ready."}
                  </p>
                </div>
              </div>
            </TableCard>

            <TableCard title="Account Status" isDarkMode={isDarkMode}>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                  String(dashboard.status).toLowerCase() === "active"
                    ? "admin-status-badge--active"
                    : "admin-status-badge--inactive"
                }`}
              >
                {dashboard.statusLabel}
              </span>
              <p className="admin-text-muted mt-3 text-sm">
                Member since {memberSinceLabel}
              </p>
            </TableCard>
          </div>

          <TableCard title="Basic Profile" isDarkMode={isDarkMode}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar
                firstName={dashboard.firstName}
                lastName={dashboard.lastName}
                imageUrl={dashboard.photo}
                alt={dashboard.displayName}
                size="profile"
              />
              <dl className="min-w-0 flex-1 space-y-2.5 text-sm">
                <ProfileRow label="Name" value={dashboard.displayName} />
                <ProfileRow label="Email" value={dashboard.email} />
                <ProfileRow label="Phone" value={dashboard.phone} />
                <ProfileRow label="Member since" value={memberSinceLabel} />
              </dl>
            </div>
          </TableCard>
        </>
      ) : null}
    </div>
  );
}

export default PanelistDashboard;
