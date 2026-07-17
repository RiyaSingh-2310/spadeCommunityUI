import { Loader2 } from "lucide-react";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import { useModulePermission } from "../../permissions/useModulePermission";
import { PROJECT_STATUS_OPTIONS } from "../data/surveyDetailsData";
import { primaryBtnClass } from "./surveyDetailsShared";

export const SURVEY_DETAIL_TABS = [
  { id: "project-details", label: "Project Information" },
  { id: "project-urls", label: "Project URL" },
  // { id: "supplier-mapping", label: "Supplier Mapping" },
  // { id: "project-report", label: "Project Reports" },
];

export const SALES_PROJECT_DETAIL_TABS = [
  { id: "project-details", label: "Project Information" },
  // { id: "project-report", label: "Project Reports" },
];

/**
 * Build Project Details tabs for Single Link vs Multi Link.
 * @param {{
 *   isMultiLink?: boolean,
 *   multiUrlEnabled?: boolean,
 *   salesViewMode?: boolean,
 * }} [options]
 */
export function getSurveyDetailTabs({
  isMultiLink = false,
  multiUrlEnabled = false,
  salesViewMode = false,
} = {}) {
  if (salesViewMode) {
    return SALES_PROJECT_DETAIL_TABS;
  }

  const tabs = [
    { id: "project-details", label: "Project Information" },
    { id: "project-urls", label: "Project URL" },
  ];

  if (isMultiLink) {
    tabs.push({
      id: "project-multi-url",
      label: "Multi URL",
      disabled: !multiUrlEnabled,
    });
  }

  // Temporarily hidden per product flow:
  // tabs.push({ id: "supplier-mapping", label: "Supplier Mapping" });
  // tabs.push({ id: "project-report", label: "Project Reports" });

  return tabs;
}

function SurveyDetailsHeader({
  activeTab,
  onTabChange,
  projectStatus,
  draftStatus,
  onStatusChange,
  onStatusUpdate,
  isUpdatingStatus,
  onEditSurvey,
  surveyId,
  tabs = SURVEY_DETAIL_TABS,
  readOnly = false,
}) {
  const { canWrite } = useModulePermission("survey");
  const allowWrite = canWrite && !readOnly;
  const statusChanged = draftStatus !== projectStatus;
  const canUpdateStatus = statusChanged && !isUpdatingStatus;

  return (
    <div className="admin-header-surface mb-6 rounded-2xl border p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div
          className="flex flex-wrap gap-1 rounded-xl border p-1"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
          role="tablist"
          aria-label="Project detail sections"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = Boolean(tab.disabled);
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-disabled={isDisabled}
                disabled={isDisabled}
                title={
                  isDisabled
                    ? "Save Project URL first to unlock Project Multi URL"
                    : undefined
                }
                onClick={() => {
                  if (isDisabled) return;
                  onTabChange(tab.id);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isDisabled
                    ? "cursor-not-allowed opacity-45 admin-text-muted"
                    : isActive
                      ? "cursor-pointer bg-[#10a950] text-white shadow-sm"
                      : "admin-text-muted cursor-pointer hover:bg-[var(--admin-permissions-row-hover)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center xl:justify-center">
          {allowWrite && (
            <button type="button" onClick={onEditSurvey} className={primaryBtnClass}>
              Edit Project
            </button>
          )}
        </div>

        {!readOnly ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <label className="admin-text-muted text-xs font-semibold uppercase tracking-wide sm:sr-only">
              Project Status
            </label>
            <SearchableSelect
              inputClass="admin-text h-10 min-w-[140px] rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] px-3 text-sm font-medium outline-none"
              value={draftStatus}
              onChange={onStatusChange}
              options={PROJECT_STATUS_OPTIONS}
              disabled={!allowWrite || isUpdatingStatus}
              searchable={false}
              aria-label="Project status"
            />
            {allowWrite && (
              <button
                type="button"
                onClick={onStatusUpdate}
                disabled={!canUpdateStatus}
                className={`${primaryBtnClass} flex min-w-[100px] items-center justify-center gap-2`}
              >
                {isUpdatingStatus && <Loader2 size={16} className="animate-spin" />}
                {isUpdatingStatus ? "Updating..." : "Update"}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end justify-end gap-1">
            <span className="admin-text-muted text-xs font-semibold uppercase tracking-wide">
              Project Status
            </span>
            <span className="admin-text text-sm font-semibold">{projectStatus}</span>
          </div>
        )}
      </div>
      <p className="admin-text-subtle mt-3 text-xs sm:hidden">Project Code: {surveyId}</p>
    </div>
  );
}

export default SurveyDetailsHeader;
