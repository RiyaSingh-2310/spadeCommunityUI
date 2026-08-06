import { useEffect, useState } from "react";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { toastApiError, toastApiInfo } from "../../../services/toast/apiToast";
import {
  listSupplierMappings,
  mapSupplierMappingToRow,
} from "../services/supplierMappingApi";
import { downloadProjectReport } from "../services/projectReportApi";
import { primaryBtnClass, secondaryBtnClass } from "./surveyDetailsShared";
import {
  openProjectReportView,
  PROJECT_REPORT_TYPES,
} from "../utils/projectReportNavigation";

function ReportSection({ title, children, isDarkMode }) {
  return (
    <TableCard title={title} isDarkMode={isDarkMode}>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </TableCard>
  );
}

function ProjectReportTab({ isDarkMode, projectId, projectUrlId, projectName }) {
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [downloadingType, setDownloadingType] = useState("");

  useEffect(() => {
    let cancelled = false;
    const resolvedProjectId = String(projectId ?? "").trim();
    const resolvedProjectUrlId = String(projectUrlId ?? "").trim();

    async function loadSuppliers() {
      if (!resolvedProjectId || !resolvedProjectUrlId) {
        setSupplierOptions([]);
        setSelectedSupplier("");
        return;
      }

      setIsLoadingSuppliers(true);
      try {
        const records = await listSupplierMappings({
          projectId: resolvedProjectId,
          projectUrlId: resolvedProjectUrlId,
        });
        if (cancelled) return;

        const options = (Array.isArray(records) ? records : [])
          .map((record, index) => mapSupplierMappingToRow(record, index))
          .filter((row) => row?.partnerId || row?.partnerCode)
          .map((row) => ({
            value: String(row.partnerId || row.partnerCode),
            label: [row.partnerName, row.partnerCode]
              .filter(Boolean)
              .join(" — ") || String(row.partnerId),
          }));

        setSupplierOptions(options);
        setSelectedSupplier((prev) => {
          if (prev && options.some((option) => option.value === prev)) {
            return prev;
          }
          return options[0]?.value ?? "";
        });
      } catch (error) {
        if (cancelled) return;
        setSupplierOptions([]);
        setSelectedSupplier("");
        toastApiError(error);
      } finally {
        if (!cancelled) setIsLoadingSuppliers(false);
      }
    }

    loadSuppliers();
    return () => {
      cancelled = true;
    };
  }, [projectId, projectUrlId]);

  const handleViewReport = (reportType, { supplierId } = {}) => {
    const resolvedProjectId = String(projectId ?? "").trim();
    if (!resolvedProjectId) {
      toastApiInfo({ message: "Project id is missing. Unable to open report." });
      return;
    }

    if (reportType === PROJECT_REPORT_TYPES.SUPPLIER && !String(supplierId ?? "").trim()) {
      toastApiInfo({ message: "Select a supplier before viewing the report." });
      return;
    }

    openProjectReportView({
      projectId: resolvedProjectId,
      reportType,
      supplierId,
      projectName,
    });
  };

  const handleDownloadReport = async (reportType, { supplierId } = {}) => {
    const resolvedProjectId = String(projectId ?? "").trim();
    if (!resolvedProjectId) {
      toastApiInfo({ message: "Project id is missing. Unable to download report." });
      return;
    }

    if (reportType === PROJECT_REPORT_TYPES.SUPPLIER && !String(supplierId ?? "").trim()) {
      toastApiInfo({ message: "Select a supplier before downloading the report." });
      return;
    }

    setDownloadingType(reportType);
    try {
      await downloadProjectReport({
        projectId: resolvedProjectId,
        reportType,
        supplierId,
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setDownloadingType("");
    }
  };

  return (
    <div className="space-y-6">
      <ReportSection title="Project Report" isDarkMode={isDarkMode}>
        <button
          type="button"
          className={secondaryBtnClass}
          onClick={() => handleViewReport(PROJECT_REPORT_TYPES.PROJECT)}
        >
          View
        </button>
        <button
          type="button"
          className={primaryBtnClass}
          disabled={downloadingType === PROJECT_REPORT_TYPES.PROJECT}
          onClick={() => handleDownloadReport(PROJECT_REPORT_TYPES.PROJECT)}
        >
          {downloadingType === PROJECT_REPORT_TYPES.PROJECT ? "Downloading..." : "Download"}
        </button>
      </ReportSection>

      <ReportSection title="Prescreen Report" isDarkMode={isDarkMode}>
        <button
          type="button"
          className={secondaryBtnClass}
          onClick={() => handleViewReport(PROJECT_REPORT_TYPES.PRESCREEN)}
        >
          View
        </button>
        <button
          type="button"
          className={primaryBtnClass}
          disabled={downloadingType === PROJECT_REPORT_TYPES.PRESCREEN}
          onClick={() => handleDownloadReport(PROJECT_REPORT_TYPES.PRESCREEN)}
        >
          {downloadingType === PROJECT_REPORT_TYPES.PRESCREEN ? "Downloading..." : "Download"}
        </button>
      </ReportSection>

      <ReportSection title="Supplier Report" isDarkMode={isDarkMode}>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="admin-text flex min-w-0 flex-1 flex-col gap-2 text-sm font-semibold sm:max-w-xs">
            <span>Select Supplier</span>
            <SearchableSelect
              inputClass="admin-text h-10 rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] px-3 text-sm font-medium outline-none"
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              options={supplierOptions}
              placeholder={
                isLoadingSuppliers ? "Loading suppliers..." : "Select supplier"
              }
              loading={isLoadingSuppliers}
              loadingLabel="Loading suppliers..."
              emptyMessage="No suppliers mapped"
              searchPlaceholder="Search supplier..."
              aria-label="Select supplier"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={secondaryBtnClass}
              onClick={() =>
                handleViewReport(PROJECT_REPORT_TYPES.SUPPLIER, {
                  supplierId: selectedSupplier,
                })
              }
            >
              View
            </button>
            <button
              type="button"
              className={primaryBtnClass}
              disabled={downloadingType === PROJECT_REPORT_TYPES.SUPPLIER}
              onClick={() =>
                handleDownloadReport(PROJECT_REPORT_TYPES.SUPPLIER, {
                  supplierId: selectedSupplier,
                })
              }
            >
              {downloadingType === PROJECT_REPORT_TYPES.SUPPLIER ? "Downloading..." : "Download"}
            </button>
          </div>
        </div>
      </ReportSection>
    </div>
  );
}

export default ProjectReportTab;
