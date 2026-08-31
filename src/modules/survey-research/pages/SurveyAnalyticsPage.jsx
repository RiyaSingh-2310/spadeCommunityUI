import PortalWorkflowDiagram from "../components/PortalWorkflowDiagram";
import {
  AnalyticsKpiCard,
  FunnelChart,
  OutcomeDonut,
  TrendBarChart,
} from "../components/PortalAnalyticsWidgets";
import { ANALYTICS_SUMMARY } from "../data/surveyResearchData";

function SurveyAnalyticsPage() {
  const data = ANALYTICS_SUMMARY;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.02em]" style={{ color: "var(--srp-text-muted)" }}>
          Survey Analytics
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Performance Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
          Demo analytics for respondent outcomes, conversion, and daily trends.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnalyticsKpiCard label="Total Respondents" value={data.totalRespondents.toLocaleString()} />
        <AnalyticsKpiCard label="Completed" value={data.completed.toLocaleString()} tone="success" />
        <AnalyticsKpiCard label="Terminated" value={data.terminated.toLocaleString()} tone="warning" />
        <AnalyticsKpiCard label="Over Quota" value={data.overQuota.toLocaleString()} />
        <AnalyticsKpiCard label="Quality Failed" value={data.qualityFailed.toLocaleString()} tone="danger" />
        <AnalyticsKpiCard label="Conversion Rate" value={`${data.conversionRate}%`} tone="success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="srp-card p-5">
          <h2 className="text-lg font-semibold">Daily Trend</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Completes vs terminates over the last 7 days.
          </p>
          <div className="mt-5">
            <TrendBarChart data={data.trend} />
          </div>
        </section>

        <section className="srp-card p-5">
          <h2 className="text-lg font-semibold">Outcome Distribution</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Respondent disposition breakdown for the active wave.
          </p>
          <div className="mt-5">
            <OutcomeDonut
              completed={data.completed}
              terminated={data.terminated}
              overQuota={data.overQuota}
              qualityFailed={data.qualityFailed}
            />
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="srp-card p-5">
          <h2 className="text-lg font-semibold">Respondent Funnel</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Drop-off across pre-screen, survey, and completion stages.
          </p>
          <div className="mt-5">
            <FunnelChart stages={data.funnel} />
          </div>
        </section>

        <section className="srp-card p-5">
          <h2 className="text-lg font-semibold">Workflow Context</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Analytics map to the end-to-end survey management workflow.
          </p>
          <div className="mt-5">
            <PortalWorkflowDiagram />
          </div>
        </section>
      </div>
    </div>
  );
}

export default SurveyAnalyticsPage;
