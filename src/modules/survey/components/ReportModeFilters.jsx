import { getAdminInputClass } from "../../shared/utils/formStyles";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import StatusToggle from "../../../components/admin/StatusToggle";

export const REPORT_MODE = {
  LIVE: "live",
  TEST: "test",
};

export function normalizeReportMode(mode) {
  return String(mode ?? "").trim().toLowerCase() === "test"
    ? REPORT_MODE.TEST
    : REPORT_MODE.LIVE;
}

export function isReportTestModeValue(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return key === "true" || key === "1" || key === "yes" || key === "test";
}

const FILTER_LABEL_CLASS = "admin-text shrink-0 text-sm font-semibold";

function ReportModeFilters({
  mode = REPORT_MODE.LIVE,
  onModeChange,
  supplierId = "",
  onSupplierChange,
  supplierOptions = [],
  isLoadingSuppliers = false,
}) {
  const isLive = normalizeReportMode(mode) === REPORT_MODE.LIVE;

  return (
    <>
      <label className="flex min-w-0 w-full items-center gap-2 sm:w-auto sm:min-w-[16rem] sm:flex-1 lg:w-[20rem] lg:flex-none">
        <span className={FILTER_LABEL_CLASS}>Supplier</span>
        <div className="min-w-0 flex-1">
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
      </label>

      <div className="flex w-full min-w-0 items-center gap-2 sm:ml-auto sm:w-auto">
        <span className={FILTER_LABEL_CLASS}>Mode</span>
        <StatusToggle
          checked={isLive}
          labelOn="Live"
          labelOff="Test"
          onChange={() =>
            onModeChange?.(isLive ? REPORT_MODE.TEST : REPORT_MODE.LIVE)
          }
        />
      </div>
    </>
  );
}

export default ReportModeFilters;
