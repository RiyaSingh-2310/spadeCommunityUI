import { Link } from "react-router-dom";
import { BarChart3, FolderKanban, Layers3 } from "lucide-react";
import PortalWorkflowDiagram from "../components/PortalWorkflowDiagram";
import { ANALYTICS_SUMMARY, PRESCREENER_GROUPS, PROJECT_SURVEY } from "../data/mockSurveyResearchData";

function StatCard({ label, value, hint }) {
  return (
    <div className="srp-card p-5">
      <p className="text-sm font-medium" style={{ color: "var(--srp-text-muted)" }}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs" style={{ color: "var(--srp-text-muted)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function PortalOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Research Operations Overview</h1>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Premium survey workflow demo for pre-screening, project delivery, supplier mapping, and
            analytics.
          </p>
        </div>
        <Link to="/survey-research/pre-screener-groups" className="srp-btn-primary">
          Manage Pre-Screener Groups
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pre-Screener Groups" value={PRESCREENER_GROUPS.length} hint="Configured questionnaires" />
        <StatCard label="Live Project" value={PROJECT_SURVEY.status} hint={PROJECT_SURVEY.projectName} />
        <StatCard label="Total Respondents" value={ANALYTICS_SUMMARY.totalRespondents.toLocaleString()} hint="Current wave" />
        <StatCard label="Conversion Rate" value={`${ANALYTICS_SUMMARY.conversionRate}%`} hint="Completed / started" />
      </div>

      <div className="srp-card p-5">
        <h2 className="text-lg font-semibold">Survey Workflow</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
          End-to-end respondent journey from pre-screen through reward processing.
        </p>
        <div className="mt-5">
          <PortalWorkflowDiagram />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link to="/survey-research/pre-screener-groups" className="srp-card block p-5 transition hover:border-indigo-300">
          <Layers3 size={22} style={{ color: "var(--srp-primary)" }} />
          <h3 className="mt-3 font-semibold">Pre-Screener Groups</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Build, preview, and manage eligibility questionnaires.
          </p>
        </Link>
        <Link to="/survey-research/projects" className="srp-card block p-5 transition hover:border-indigo-300">
          <FolderKanban size={22} style={{ color: "var(--srp-primary)" }} />
          <h3 className="mt-3 font-semibold">Project & Survey Management</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Review quotas, supplier mapping, and redirect URLs.
          </p>
        </Link>
        <Link to="/survey-research/analytics" className="srp-card block p-5 transition hover:border-indigo-300">
          <BarChart3 size={22} style={{ color: "var(--srp-primary)" }} />
          <h3 className="mt-3 font-semibold">Survey Analytics</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Monitor completes, terminates, and conversion performance.
          </p>
        </Link>
      </div>
    </div>
  );
}

export default PortalOverviewPage;
