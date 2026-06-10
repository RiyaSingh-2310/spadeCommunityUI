import { Loader2 } from "lucide-react";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import { useModulePermission } from "../../permissions/useModulePermission";
import { PROJECT_STATUS_OPTIONS } from "../data/surveyDetailsData";
import { primaryBtnClass } from "./surveyDetailsShared";

export const SURVEY_DETAIL_TABS = [
  { id: "project-details", label: "Project Details" },
  { id: "supplier-mapping", label: "Supplier Mapping" },
  { id: "project-report", label: "Project Report" },
];

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
}) {
  const { canWrite } = useModulePermission("survey");
  const statusChanged = draftStatus !== projectStatus;
  const canUpdateStatus = statusChanged && !isUpdatingStatus;

  return (
    <div className="admin-header-surface mb-6 rounded-2xl border p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div
          className="flex flex-wrap gap-1 rounded-xl border p-1"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
          role="tablist"
          aria-label="Survey detail sections"
        >
          {SURVEY_DETAIL_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#10a950] text-white shadow-sm"
                    : "admin-text-muted hover:bg-[var(--admin-permissions-row-hover)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center xl:justify-center">
          {canWrite && (
            <button type="button" onClick={onEditSurvey} className={primaryBtnClass}>
              Edit Survey
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <label className="admin-text-muted text-xs font-semibold uppercase tracking-wide sm:sr-only">
            Project Status
          </label>
          <SearchableSelect
            inputClass="admin-text h-10 min-w-[140px] rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] px-3 text-sm font-medium outline-none"
            value={draftStatus}
            onChange={onStatusChange}
            options={PROJECT_STATUS_OPTIONS}
            disabled={!canWrite || isUpdatingStatus}
            searchable={false}
            aria-label="Project status"
          />
          {canWrite && (
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
      </div>
      <p className="admin-text-subtle mt-3 text-xs sm:hidden">Survey ID: {surveyId}</p>
    </div>
  );
}

export default SurveyDetailsHeader;
