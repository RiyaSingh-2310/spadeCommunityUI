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
  { key: "projectManagerName", label: "Project Manager Name" },
];

const PROJECT_DETAILS_FIELDS = [
  { key: "country", label: "Country" },
  { key: "language", label: "Language" },
  { key: "cpi", label: "CPI" },
  { key: "loi", label: "LOI" },
  { key: "projectLinkType", label: "Link Type" },
  { key: "sampleSize", label: "Sample Size" },
];

const SURVEY_STATISTICS_FIELDS = [
  { key: "urlCount", label: "URL Count" },
  { key: "completed", label: "Completed" },
  { key: "terminated", label: "Terminated" },
  { key: "remainingQuota", label: "Remaining Quota" },
];

const PROJECT_DATES_FIELDS = [
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "updatedDate", label: "Updated Date" },
];

function InfoRow({ label, value }) {
  const display = value == null || String(value).trim() === "" ? "—" : value;
  return (
    <div className="grid grid-cols-1 gap-0.5 py-1.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start sm:gap-x-4">
      <dt className="admin-text-muted text-xs font-medium">{label}</dt>
      <dd className="admin-text min-w-0 wrap-break-word text-sm font-medium">
        {display}
      </dd>
    </div>
  );
}

function InfoSection({ title, fields }) {
  if (!fields.length) return null;

  return (
    <section className="rounded-xl border border-[var(--admin-header-surface-border)] px-3 py-2.5 sm:px-4">
      {title ? (
        <h3 className="admin-text-muted mb-1 text-xs font-semibold uppercase tracking-wide">
          {title}
        </h3>
      ) : null}
      <dl>
        {fields.map((field) => (
          <InfoRow key={field.key} label={field.label} value={field.value} />
        ))}
      </dl>
    </section>
  );
}

function ProjectUrlInfoModal({ isOpen, onClose, isDarkMode, projectId, projectName }) {
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

  const withValues = (fields) =>
    fields.map((field) => ({
      ...field,
      value: summary?.[field.key] ?? "—",
    }));

  const informationFields = withValues(PROJECT_INFORMATION_FIELDS);
  const detailFields = withValues(PROJECT_DETAILS_FIELDS);
  const statisticFields = withValues(SURVEY_STATISTICS_FIELDS);
  const dateFields = withValues(PROJECT_DATES_FIELDS);

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
          className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <div className="min-w-0">
            <h2 id="project-url-info-title" className="admin-text text-lg font-bold">
              Project Information
            </h2>
          </div>
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
              <InfoSection fields={informationFields} />
              <InfoSection title="Project Details" fields={detailFields} />
              <InfoSection title="Survey Statistics" fields={statisticFields} />
              {/* <InfoSection title="Project Dates" fields={dateFields} /> */}
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
