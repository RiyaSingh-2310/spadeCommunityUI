import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  DEFAULT_ERROR_TOAST,
  resolveApiToastMessage,
  toastApiError,
} from "../../../services/toast/apiToast";
import { getProjectUrlInfoSummary } from "../services/projectUrlInfoApi";

const PROJECT_INFORMATION_FIELDS = [
  { key: "projectName", label: "Project Name" },
  { key: "clientName", label: "Client Name" },
  { key: "status", label: "Status" },
  { key: "salesManager", label: "Sales Manager" },
  { key: "projectManagerName", label: "Project Manager" },
];

const URL_DETAIL_FIELDS = [
  { key: "projectLinkType", label: "Link Type" },
  { key: "country", label: "Country" },
  { key: "language", label: "Language" },
  { key: "cpi", label: "CPI" },
  { key: "loi", label: "LOI" },
  { key: "completed", label: "Completed" },
  { key: "terminated", label: "Terminate" },
  { key: "sampleSize", label: "Sample Size" },
  { key: "quotaAdded", label: "Quota Added" },
  { key: "remainingQuota", label: "Remaining Quota" },
];

const OVERALL_SUMMARY_FIELDS = [
  { key: "completed", label: "Total Completed" },
  { key: "terminated", label: "Total Terminated" },
  { key: "sampleSize", label: "Total Sample Size" },
  { key: "quotaAdded", label: "Total Quota Added" },
  { key: "remainingQuota", label: "Remaining Quota" },
  { key: "quotaFull", label: "Quota Full" },
];

function InfoRow({ label, value }) {
  const display = value == null || String(value).trim() === "" ? "—" : value;
  return (
    <div className="min-w-0">
      <dt className="admin-text-muted text-xs font-medium">{label}</dt>
      <dd className="admin-text mt-0.5 wrap-break-word text-sm font-medium">
        {display}
      </dd>
    </div>
  );
}

function InfoCard({ title, subtitle, fields, columns = 1 }) {
  if (!fields.length) return null;

  const gridClass =
    columns === 2
      ? "grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2"
      : "grid grid-cols-2 gap-y-2.5";

  return (
    <section
      className="rounded-xl border px-3 py-3 sm:px-4"
      style={{ borderColor: "var(--admin-header-surface-border)" }}
    >
      {title ? (
        <div className="mb-3">
          <h3 className="admin-text text-sm font-semibold">{title}</h3>
          {subtitle ? (
            <p className="admin-text-muted mt-0.5 text-xs">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      <dl className={gridClass}>
        {fields.map((field) => (
          <InfoRow key={field.key} label={field.label} value={field.value} />
        ))}
      </dl>
    </section>
  );
}

function withValues(source, fields) {
  return fields.map((field) => ({
    ...field,
    value: source?.[field.key] ?? "—",
  }));
}

function ProjectUrlInfoModal({ isOpen, onClose, isDarkMode, projectId }) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSummary(null);
      setIsLoading(false);
      setErrorMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !projectId) return undefined;

    let cancelled = false;

    async function loadSummary() {
      setIsLoading(true);
      setErrorMessage("");
      setSummary(null);
      try {
        const data = await getProjectUrlInfoSummary(projectId);
        if (cancelled) return;
        setSummary(data);
      } catch (error) {
        if (cancelled) return;
        const message = resolveApiToastMessage(error, DEFAULT_ERROR_TOAST);
        setErrorMessage(message || DEFAULT_ERROR_TOAST);
        toastApiError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const urls = Array.isArray(summary?.urls) ? summary.urls : [];

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close project information"
        onClick={onClose}
      />
      <div
        className="admin-header-surface relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-url-info-title"
        data-theme-mode={isDarkMode ? "dark" : "light"}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <h2 id="project-url-info-title" className="admin-text text-lg font-bold">
            Project Information
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="admin-icon-btn admin-text-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">
          {isLoading || (!summary && !errorMessage) ? (
            <div className="admin-text flex items-center justify-center gap-2 py-12 text-sm">
              <Loader2 size={22} className="animate-spin text-[var(--admin-success-text)]" />
              Loading project information...
            </div>
          ) : errorMessage ? (
            <p className="admin-text rounded-xl border border-[var(--admin-danger-text)]/30 bg-[var(--admin-danger-text)]/10 px-4 py-6 text-center text-sm">
              {errorMessage}
            </p>
          ) : summary ? (
            <div className="space-y-3">
              <InfoCard
                fields={withValues(summary.project, PROJECT_INFORMATION_FIELDS)}
              />

              {urls.length ? (
                urls.map((url, index) => (
                  <InfoCard
                    key={url.id}
                    title={`Project URL ${index + 1}`}
                    fields={withValues(url, URL_DETAIL_FIELDS)}
                    columns={2}
                  />
                ))
              ) : (
                <p className="admin-text-muted rounded-xl border px-4 py-5 text-center text-sm"
                  style={{ borderColor: "var(--admin-header-surface-border)" }}
                >
                  No Project URLs found for this project.
                </p>
              )}

              <InfoCard
                title="Overall Project Summary"
                subtitle="Combined totals across all Project URLs"
                fields={withValues(summary.totals, OVERALL_SUMMARY_FIELDS)}
                columns={2}
              />
            </div>
          ) : (
            <p className="admin-text-muted py-10 text-center text-sm">
              No project information available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectUrlInfoModal;
