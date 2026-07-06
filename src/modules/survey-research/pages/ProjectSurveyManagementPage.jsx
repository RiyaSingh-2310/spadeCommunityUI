import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import PortalStatusBadge from "../components/PortalStatusBadge";
import PortalWorkflowDiagram from "../components/PortalWorkflowDiagram";
import {
  getPreScreenerGroupById,
  PRESCREENER_GROUPS,
  PROJECT_SURVEY,
} from "../data/mockSurveyResearchData";

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--srp-text-muted)" }}>
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function QuotaBar({ segment, target, filled }) {
  const percent = Math.min(100, Math.round((filled / target) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{segment}</span>
        <span style={{ color: "var(--srp-text-muted)" }}>
          {filled} / {target}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--srp-surface-muted)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, background: "var(--srp-primary)" }}
        />
      </div>
    </div>
  );
}

function ProjectSurveyManagementPage() {
  const project = PROJECT_SURVEY;
  const linkedGroup = getPreScreenerGroupById(project.preScreenerGroupId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--srp-text-muted)" }}>
            Project & Survey Management
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Client: {project.clientName}
          </p>
        </div>
        <PortalStatusBadge status={project.status} />
      </div>

      <div className="srp-card p-5">
        <h2 className="text-lg font-semibold">Survey Workflow</h2>
        <div className="mt-4">
          <PortalWorkflowDiagram />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="srp-card p-5">
          <h2 className="text-lg font-semibold">Project Details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailItem label="Project ID" value={project.id} />
            <DetailItem label="Client" value={project.clientName} />
            <DetailItem label="Status" value={project.status} />
            <DetailItem label="Pre-Screener Group" value={linkedGroup?.groupName ?? "—"} />
          </dl>
          {linkedGroup ? (
            <Link
              to={`/survey-research/pre-screener-groups`}
              className="srp-btn-ghost mt-4 inline-flex"
            >
              View Pre-Screener Groups
            </Link>
          ) : null}
        </section>

        <section className="srp-card p-5">
          <h2 className="text-lg font-semibold">Survey Details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailItem label="Survey Title" value={project.surveyTitle} />
            <DetailItem label="Sample Size" value={project.sampleSize.toLocaleString()} />
            <DetailItem label="CPI" value={project.cpi} />
            <DetailItem label="IR" value={project.ir} />
            <DetailItem label="LOI" value={project.loi} />
          </dl>
        </section>
      </div>

      <section className="srp-card p-5">
        <h2 className="text-lg font-semibold">Quotas</h2>
        <div className="mt-4 space-y-4">
          {project.quotas.map((quota) => (
            <QuotaBar key={quota.segment} {...quota} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="srp-card overflow-hidden">
          <h2 className="border-b px-5 py-4 text-lg font-semibold" style={{ borderColor: "var(--srp-border)" }}>
            Supplier Mapping
          </h2>
          <div className="srp-table-wrap">
            <table className="srp-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Allocation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {project.supplierMapping.map((row) => (
                  <tr key={row.supplier}>
                    <td>{row.supplier}</td>
                    <td>{row.allocation}</td>
                    <td>
                      <PortalStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="srp-card overflow-hidden">
          <h2 className="border-b px-5 py-4 text-lg font-semibold" style={{ borderColor: "var(--srp-border)" }}>
            Sample Mapping
          </h2>
          <div className="srp-table-wrap">
            <table className="srp-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Completes</th>
                  <th>Terminates</th>
                </tr>
              </thead>
              <tbody>
                {project.sampleMapping.map((row) => (
                  <tr key={row.source}>
                    <td>{row.source}</td>
                    <td>{row.completes}</td>
                    <td>{row.terminates}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="srp-card p-5">
        <h2 className="text-lg font-semibold">Redirect URLs</h2>
        <div className="mt-4 grid gap-3">
          {[
            { label: "Complete URL", value: project.redirectUrls.complete },
            { label: "Terminate URL", value: project.redirectUrls.terminate },
            { label: "Over Quota URL", value: project.redirectUrls.overQuota },
            { label: "Quality Term URL", value: project.redirectUrls.qualityTerm },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface-muted)" }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--srp-text-muted)" }}>
                  {item.label}
                </p>
                <p className="mt-1 break-all font-mono text-xs">{item.value}</p>
              </div>
              <a href={item.value} target="_blank" rel="noreferrer" className="srp-btn-ghost shrink-0">
                <ExternalLink size={14} />
                Open
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="srp-card p-5">
        <h2 className="text-lg font-semibold">Available Pre-Screener Groups</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
          Demo list of groups that can be linked to survey projects.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRESCREENER_GROUPS.map((group) => (
            <Link
              key={group.id}
              to={`/survey-research/pre-screener-groups`}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: "var(--srp-border)" }}
            >
              {group.groupName}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProjectSurveyManagementPage;
