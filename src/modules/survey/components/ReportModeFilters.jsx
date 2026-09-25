import { useRef } from "react";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import AdminDateRangeFilter from "../../../components/admin/AdminDateRangeFilter";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import {
  REPORT_MODE,
  REPORT_STATUS,
  REPORT_STATUS_OPTIONS,
  normalizeReportMode,
  normalizeReportStatus,
} from "../utils/reportFilterConstants";

const FILTER_LABEL_CLASS = "admin-text shrink-0 text-sm font-semibold";
const FILTER_SELECT_CLASS = `${getAdminInputClass()} h-11 w-full`;
const FILTER_FIELD_CLASS = "flex min-w-0 flex-col gap-2";

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
  onDateRangeChange,
  supplierId = "",
  onSupplierChange,
  supplierOptions = [],
  isLoadingSuppliers = false,
  hideSupplier = false,
  mode = REPORT_MODE.LIVE,
  onModeChange,
}) {
  const resolvedMode = normalizeReportMode(mode);
  const resolvedStatus = normalizeReportStatus(status) || REPORT_STATUS.ALL;
  const rangeRef = useRef({ startDate, endDate });
  const pendingRangeRef = useRef(null);
  rangeRef.current = { startDate, endDate };

  const commitDateRange = (patch) => {
    const next = {
      ...rangeRef.current,
      ...pendingRangeRef.current,
      ...patch,
    };
    rangeRef.current = next;
    pendingRangeRef.current = next;
    queueMicrotask(() => {
      const committed = pendingRangeRef.current;
      if (!committed) return;
      pendingRangeRef.current = null;
      if (onDateRangeChange) {
        onDateRangeChange(committed);
        return;
      }
      onStartDateChange?.(committed.startDate);
      onEndDateChange?.(committed.endDate);
    });
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
      <div className={`${FILTER_FIELD_CLASS} w-full max-w-[20rem] shrink-0 overflow-hidden`}>
        <span className={FILTER_LABEL_CLASS}>Search</span>
        <DebouncedSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          onDebouncedChange={onDebouncedSearch}
          placeholder="Search..."
          aria-label="Search report"
          className="min-w-0 w-full"
          maxWidthClass="w-full max-w-[20rem]"
        />
      </div>

      <div className={`grid w-full min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:w-auto xl:shrink-0 ${hideSupplier ? "xl:grid-cols-[9.5rem_20.5rem_7.5rem]" : "xl:grid-cols-[9.5rem_20.5rem_11.25rem_7.5rem]"}`}>
        <div className={`${FILTER_FIELD_CLASS} w-full`}>
          <label htmlFor="project-report-status-filter" className={FILTER_LABEL_CLASS}>
            Status
          </label>
          <SearchableSelect
            id="project-report-status-filter"
            inputClass={`${getAdminInputClass()} min-w-[140px]`}
            value={resolvedStatus}
            onChange={(nextStatus) => onStatusChange?.(nextStatus)}
            options={REPORT_STATUS_OPTIONS}
            searchable={false}
            aria-label="Status"
          />
        </div>

        <div className={`${FILTER_FIELD_CLASS} w-full overflow-hidden`}>
          <span className={FILTER_LABEL_CLASS}>Date Range</span>
          <AdminDateRangeFilter
            fromDate={startDate}
            toDate={endDate}
            onFromChange={(value) => commitDateRange({ startDate: value })}
            onToChange={(value) => commitDateRange({ endDate: value })}
            className="w-full min-w-0 sm:w-full"
          />
        </div>

        {!hideSupplier ? (
        <div className={`${FILTER_FIELD_CLASS} w-full overflow-hidden`}>
          <span className={FILTER_LABEL_CLASS}>Supplier</span>
          <SearchableSelect
            inputClass={`${getAdminInputClass()} max-w-full`}
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
        ) : null}

        <div className={`${FILTER_FIELD_CLASS} w-full overflow-hidden`}>
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
    </div>
  );
}

export default ReportModeFilters;
