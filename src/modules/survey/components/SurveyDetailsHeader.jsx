import { SURVEY_DETAIL_TAB_IDS } from "../utils/surveyDetailsNavigation";
import { Loader2 } from "lucide-react";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import { useModulePermission } from "../../permissions/useModulePermission";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { PROJECT_STATUS_OPTIONS } from "../data/surveyFormData";
import { primaryBtnClass, secondaryBtnClass } from "./surveyDetailsShared";

export const SURVEY_DETAIL_TABS = [
  { id: SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS, label: "Project Information" },
  { id: SURVEY_DETAIL_TAB_IDS.PROJECT_URLS, label: "Project URLs" },
  { id: SURVEY_DETAIL_TAB_IDS.PARTNER_MAPPING, label: "Partner Mapping" },
];

/**
 * Build Project Details tabs.
 * Partner login uses a two-tab read-only view.
 */
export function getSurveyDetailTabs({ partnerView = false } = {}) {
  if (partnerView) {
    return [
      {
        id: SURVEY_DETAIL_TAB_IDS.PARTNER_INFORMATION,
        label: "Partner Information",
      },
      {
        id: SURVEY_DETAIL_TAB_IDS.PROJECT_REPORT,
        label: "Project Report",
      },
    ];
  }

  return [
    { id: SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS, label: "Project Information" },
    { id: SURVEY_DETAIL_TAB_IDS.PROJECT_URLS, label: "Project URLs" },
    { id: SURVEY_DETAIL_TAB_IDS.PARTNER_MAPPING, label: "Partner Mapping" },
  ];
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
  onProjectReport,
  isProjectReportActive = false,
  surveyId,
  tabs = SURVEY_DETAIL_TABS,
  readOnly = false,
  showHeaderStatus = true,
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
                    ? "Save Project URL first to unlock this section"
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

        {allowWrite || onProjectReport ? (
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center xl:justify-center">
            {onProjectReport && (
              <button
                type="button"
                onClick={onProjectReport}
                className={isProjectReportActive ? primaryBtnClass : secondaryBtnClass}
              >
                Project Reports
              </button>
            )}
            {allowWrite && (
              <button type="button" onClick={onEditSurvey} className={primaryBtnClass}>
                Edit Project
              </button>
            )}
          </div>
        ) : null}

        {showHeaderStatus ? (
          !readOnly ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <label className="admin-text-muted text-xs font-semibold tracking-[0.02em] sm:sr-only">
                Project Status
              </label>
              <SearchableSelect
                inputClass={`${getAdminInputClass()} min-w-[140px]`}
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
              <span className="admin-text-muted text-xs font-semibold tracking-[0.02em]">
                Project Status
              </span>
              <span className="admin-text text-sm font-semibold">{projectStatus}</span>
            </div>
          )
        ) : null}
      </div>
      <p className="admin-text-subtle mt-3 text-xs sm:hidden">Project Code: {surveyId}</p>
    </div>
  );
}

export default SurveyDetailsHeader;
