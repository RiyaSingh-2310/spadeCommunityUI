import { getAdminInputClass } from "../../shared/utils/formStyles";
import AdminDateRangeFilter from "../../../components/admin/AdminDateRangeFilter";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import SearchableSelect from "../../../components/admin/SearchableSelect";

export const REPORT_MODE = {
  LIVE: "live",
  TEST: "test",
};

export const REPORT_STATUS = {
  ALL: "",
  INITIATED: "initiated",
  COMPLETED: "completed",
};

export const REPORT_STATUS_OPTIONS = [
  { value: REPORT_STATUS.ALL, label: "All" },
  { value: REPORT_STATUS.INITIATED, label: "Initiated" },
  { value: REPORT_STATUS.COMPLETED, label: "Completed" },
];

export function normalizeReportMode(mode) {
  return String(mode ?? "").trim().toLowerCase() === "test"
    ? REPORT_MODE.TEST
    : REPORT_MODE.LIVE;
}

export function normalizeReportStatus(status) {
  const key = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (key === "completed" || key === "complete") return REPORT_STATUS.COMPLETED;
  if (
    key === "initiated" ||
    key === "initiate" ||
    key === "in_progress" ||
    key === "inprogress" ||
    key === "started" ||
    key === "start"
  ) {
    return REPORT_STATUS.INITIATED;
  }
  return REPORT_STATUS.ALL;
}

export function isReportTestModeValue(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return key === "true" || key === "1" || key === "yes" || key === "test";
}

const FILTER_LABEL_CLASS = "admin-text shrink-0 text-sm font-semibold";
const FILTER_SELECT_CLASS = `${getAdminInputClass()} h-11 w-full`;
const FILTER_FIELD_CLASS =
  "flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:min-w-[11.25rem]";

function ReportModeFilters({
  searchQuery = "",
  onSearchChange,
  onDebouncedSearch,
  status = REPORT_STATUS.ALL,
  onStatusChange,
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
  supplierId = "",
  onSupplierChange,
  supplierOptions = [],
  isLoadingSuppliers = false,
  mode = REPORT_MODE.LIVE,
  onModeChange,
}) {
  const resolvedMode = normalizeReportMode(mode);
  const resolvedStatus = normalizeReportStatus(status) || REPORT_STATUS.ALL;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-3">
      <div className={`${FILTER_FIELD_CLASS} lg:min-w-[12rem] lg:max-w-[16rem] lg:flex-none`}>
        <span className={FILTER_LABEL_CLASS}>Search</span>
        <DebouncedSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          onDebouncedChange={onDebouncedSearch}
          placeholder="Search..."
          aria-label="Search report"
          className="min-w-0 w-full"
          maxWidthClass="w-full sm:max-w-none"
        />
      </div>

      <div className={`${FILTER_FIELD_CLASS} lg:w-[11.25rem] lg:flex-none`}>
        <label htmlFor="project-report-status-filter" className={FILTER_LABEL_CLASS}>
          Status
        </label>
        <select
          id="project-report-status-filter"
          className={FILTER_SELECT_CLASS}
          value={resolvedStatus}
          onChange={(event) => onStatusChange?.(event.target.value)}
          aria-label="Status"
        >
          {REPORT_STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={`${FILTER_FIELD_CLASS} lg:min-w-[16rem] lg:flex-1`}>
        <span className={FILTER_LABEL_CLASS}>Date Range</span>
        <AdminDateRangeFilter
          fromDate={startDate}
          toDate={endDate}
          onFromChange={onStartDateChange}
          onToChange={onEndDateChange}
        />
      </div>

      <div className={`${FILTER_FIELD_CLASS} lg:min-w-[14rem] lg:flex-1`}>
        <span className={FILTER_LABEL_CLASS}>Supplier</span>
        <SearchableSelect
          inputClass={getAdminInputClass()}
          value={supplierId || "__all__"}
          onChange={(next) => onSupplierChange?.(next === "__all__" ? "" : next)}
          options={[{ value: "__all__", label: "All Suppliers" }, ...supplierOptions]}
          placeholder={isLoadingSuppliers ? "Loading suppliers..." : "All Suppliers"}
          loading={isLoadingSuppliers}
          loadingLabel="Loading suppliers..."
          emptyMessage="No suppliers mapped"
          searchPlaceholder="Search supplier..."
          aria-label="Supplier"
        />
      </div>

      <div className={`${FILTER_FIELD_CLASS} lg:w-[9.5rem] lg:flex-none`}>
        <label htmlFor="project-report-mode-filter" className={FILTER_LABEL_CLASS}>
          Mode
        </label>
        <select
          id="project-report-mode-filter"
          className={FILTER_SELECT_CLASS}
          value={resolvedMode}
          onChange={(event) => onModeChange?.(normalizeReportMode(event.target.value))}
          aria-label="Mode"
        >
          <option value={REPORT_MODE.LIVE}>Live</option>
          <option value={REPORT_MODE.TEST}>Test</option>
        </select>
      </div>
    </div>
  );
}

export default ReportModeFilters;
