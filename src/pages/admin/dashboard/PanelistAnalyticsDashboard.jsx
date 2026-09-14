import { Component, useMemo, useState } from "react";
import TableCard from "../../../components/admin/TableCard";
import DashboardLoadError from "./DashboardLoadError";
import {
  AnalyticsDonutChart,
  AnalyticsHistogram,
  AnalyticsHorizontalBars,
  SummaryCard,
} from "./dashboardCharts";
import { numberFmt } from "./dashboardUtils";
import { usePanelistAnalytics } from "./usePanelistAnalytics";
import { Users, ClipboardList, Gift, FolderKanban } from "lucide-react";

const KPI_ICONS = [Users, FolderKanban, ClipboardList, FolderKanban, Gift, Gift, ClipboardList, Gift];
const QUESTIONS_PAGE_SIZE = 8;

class QuestionChartBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="admin-text-muted py-8 text-center text-sm">
          Unable to render this question chart.
        </p>
      );
    }
    return this.props.children;
  }
}

function formatResponseMeta(item) {
  const answered = numberFmt(item.total ?? 0);
  if (item.skipped > 0) {
    return `${answered} answered · ${numberFmt(item.skipped)} skipped`;
  }
  return `${answered} responses`;
}

function QuestionAnalyticsCard({ item, isDarkMode }) {
  return (
    <TableCard isDarkMode={isDarkMode}>
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="admin-text text-base font-semibold leading-snug break-words sm:text-lg">
            {item.title}
          </h3>
          <p className="admin-text-muted text-sm">{formatResponseMeta(item)}</p>
        </div>

        <QuestionChartBoundary>
          {item.chart === "empty" || item.total === 0 ? (
          <p className="admin-text-muted py-8 text-center text-sm">
            No response data available for this question.
          </p>
        ) : item.chart === "donut" ? (
          <AnalyticsDonutChart data={item.series} />
        ) : item.chart === "histogram" ? (
          <AnalyticsHistogram data={item.series} />
        ) : item.chart === "table" ? (
          item.series.length === 0 ? (
            <p className="admin-text-muted py-8 text-center text-sm">
              No response data available for this question.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-full text-sm">
                <thead>
                  <tr className="admin-text-muted">
                    <th className="px-3 py-2 text-left">Answer</th>
                    <th className="px-3 py-2 text-left">Count</th>
                    <th className="px-3 py-2 text-left">Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {item.series.slice(0, 12).map((row) => (
                    <tr key={row.label}>
                      <td className="admin-text max-w-[28rem] break-words px-3 py-2">{row.label}</td>
                      <td className="admin-text px-3 py-2">{numberFmt(row.value)}</td>
                      <td className="admin-text px-3 py-2">{row.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <AnalyticsHorizontalBars data={item.series} />
        )}
        </QuestionChartBoundary>

        {item.stats ? (
          <p className="admin-text-muted text-sm">
            Average {item.stats.average} · Median {item.stats.median} · Min {item.stats.min} · Max{" "}
            {item.stats.max}
          </p>
        ) : null}
        {item.insight ? <p className="admin-text-muted text-sm">{item.insight}</p> : null}
      </div>
    </TableCard>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--admin-header-surface-border)] bg-[var(--admin-header-surface)] p-5">
      <div className="admin-text-muted space-y-3 text-sm">
        <p>Loading question analytics...</p>
        <div className="h-32 rounded-xl bg-[var(--admin-header-search-bg)]" />
      </div>
    </div>
  );
}

function PanelistAnalyticsDashboard({ isDarkMode }) {
  const {
    loading,
    error,
    kpis,
    visualizations,
    rewardSeries,
    rewardBuckets,
    topPanelists,
    participation,
    retry,
  } = usePanelistAnalytics({ enabled: true });
  const [visibleCount, setVisibleCount] = useState(QUESTIONS_PAGE_SIZE);

  const visibleQuestions = useMemo(
    () => visualizations.slice(0, visibleCount),
    [visualizations, visibleCount]
  );

  if (error && !loading && kpis.length === 0) {
    return <DashboardLoadError message={error} onRetry={retry} />;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <article
                key={index}
                className="rounded-3xl border border-[var(--admin-header-surface-border)] bg-[var(--admin-header-surface)] p-4"
              >
                <p className="admin-text-muted text-sm">Loading...</p>
              </article>
            ))
          : kpis.map((kpi, index) => {
              const Icon = KPI_ICONS[index] ?? Users;
              return (
                <SummaryCard key={kpi.label} icon={Icon} label={kpi.label} value={kpi.value} />
              );
            })}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="admin-text text-lg font-semibold">Question-based analytics</h2>
          <p className="admin-text-muted mt-1 text-sm">
            Visualizations are generated from panelist questionnaire questions and answers.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : visualizations.length === 0 ? (
          <TableCard isDarkMode={isDarkMode}>
            <p className="admin-text-muted px-1 py-8 text-center text-sm">
              No panelist question answers are available to chart yet.
            </p>
          </TableCard>
        ) : (
          <>
            <div className="grid gap-5 xl:grid-cols-2">
              {visibleQuestions.map((item) => (
                <div
                  key={item.id}
                  className={item.chart === "histogram" || item.chart === "table" ? "xl:col-span-2" : ""}
                >
                  <QuestionAnalyticsCard item={item} isDarkMode={isDarkMode} />
                </div>
              ))}
            </div>
            {visualizations.length > visibleCount ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  className="admin-btn-cancel h-10 rounded-xl px-4 text-sm font-semibold"
                  onClick={() => setVisibleCount((count) => count + QUESTIONS_PAGE_SIZE)}
                >
                  Show more questions
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="admin-text text-lg font-semibold">Reward analytics</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard title="Reward point distribution" isDarkMode={isDarkMode}>
            {loading ? (
              <p className="admin-text-muted py-8 text-center text-sm">Loading...</p>
            ) : rewardBuckets.length === 0 ? (
              <p className="admin-text-muted py-8 text-center text-sm">
                No reward point totals found.
              </p>
            ) : (
              <AnalyticsHistogram data={rewardBuckets} />
            )}
          </TableCard>
          <TableCard title="Reward transactions" isDarkMode={isDarkMode}>
            {loading ? (
              <p className="admin-text-muted py-8 text-center text-sm">Loading...</p>
            ) : rewardSeries.length === 0 ? (
              <p className="admin-text-muted py-8 text-center text-sm">
                No reward transactions found.
              </p>
            ) : (
              <AnalyticsDonutChart data={rewardSeries} />
            )}
          </TableCard>
          <TableCard title="Top rewarded panelists" isDarkMode={isDarkMode}>
            {loading ? (
              <p className="admin-text-muted py-8 text-center text-sm">Loading...</p>
            ) : topPanelists.length === 0 ? (
              <p className="admin-text-muted py-8 text-center text-sm">
                No reward point totals found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table min-w-full text-sm">
                  <thead>
                    <tr className="admin-text-muted">
                      <th className="px-3 py-2 text-left">Panelist</th>
                      <th className="px-3 py-2 text-left">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPanelists.map((row) => (
                      <tr key={row.id}>
                        <td className="admin-text px-3 py-2">{row.name}</td>
                        <td className="admin-text px-3 py-2">{numberFmt(row.points)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TableCard>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="admin-text text-lg font-semibold">Project and survey participation</h2>
        <TableCard isDarkMode={isDarkMode}>
          {loading ? (
            <p className="admin-text-muted py-8 text-center text-sm">Loading...</p>
          ) : participation.length === 0 ? (
            <p className="admin-text-muted py-8 text-center text-sm">
              No participation data is available yet.
            </p>
          ) : (
            <AnalyticsHorizontalBars data={participation} />
          )}
        </TableCard>
      </section>
    </div>
  );
}

export default PanelistAnalyticsDashboard;
