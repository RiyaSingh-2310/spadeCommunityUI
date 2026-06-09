import { useMemo, useState } from "react";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { getSupplierMappingRows } from "../data/surveyDetailsData";
import { primaryBtnClass, secondaryBtnClass } from "./surveyDetailsShared";
import { toastApiInfo } from "../../../services/toast/apiToast";

function ReportSection({ title, children, isDarkMode }) {
  return (
    <TableCard title={title} isDarkMode={isDarkMode}>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </TableCard>
  );
}

function ProjectReportTab({ isDarkMode }) {
  const suppliers = useMemo(() => getSupplierMappingRows(), []);
  const supplierOptions = useMemo(
    () =>
      suppliers.map((row) => ({
        value: row.supplierCode,
        label: `${row.supplierName} (${row.supplierCode})`,
      })),
    [suppliers]
  );
  const [selectedSupplier, setSelectedSupplier] = useState(
    () => suppliers[0]?.supplierCode ?? ""
  );

  const handleReportAction = (reportType, action) => {
    toastApiInfo({
      message: `${reportType} — ${action} will be available when the report API is connected.`,
    });
  };

  return (
    <div className="space-y-6">
      <ReportSection title="Project Report" isDarkMode={isDarkMode}>
        <button
          type="button"
          className={secondaryBtnClass}
          onClick={() => handleReportAction("Project Report", "View")}
        >
          View
        </button>
        <button
          type="button"
          className={primaryBtnClass}
          onClick={() => handleReportAction("Project Report", "Download")}
        >
          Download
        </button>
      </ReportSection>

      <ReportSection title="Prescreen Report" isDarkMode={isDarkMode}>
        <button
          type="button"
          className={secondaryBtnClass}
          onClick={() => handleReportAction("Prescreen Report", "View")}
        >
          View
        </button>
        <button
          type="button"
          className={primaryBtnClass}
          onClick={() => handleReportAction("Prescreen Report", "Download")}
        >
          Download
        </button>
      </ReportSection>

      <ReportSection title="Supplier Report" isDarkMode={isDarkMode}>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="admin-text flex min-w-0 flex-1 flex-col gap-2 text-sm font-semibold sm:max-w-xs">
            <span>Select Supplier</span>
            <SearchableSelect
              inputClass="admin-text h-10 rounded-xl border border-[var(--admin-header-search-border)] bg-[var(--admin-header-search-bg)] px-3 text-sm font-medium outline-none"
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              options={supplierOptions}
              searchPlaceholder="Search supplier..."
              aria-label="Select supplier"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={secondaryBtnClass}
              onClick={() =>
                handleReportAction(
                  `Supplier Report (${selectedSupplier})`,
                  "View"
                )
              }
            >
              View
            </button>
            <button
              type="button"
              className={primaryBtnClass}
              onClick={() =>
                handleReportAction(
                  `Supplier Report (${selectedSupplier})`,
                  "Download"
                )
              }
            >
              Download
            </button>
          </div>
        </div>
      </ReportSection>
    </div>
  );
}

export default ProjectReportTab;
