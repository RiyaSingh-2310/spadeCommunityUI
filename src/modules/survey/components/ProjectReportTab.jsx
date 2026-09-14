import { useState } from "react";
import TableCard from "../../../components/admin/TableCard";
import { useModulePermission } from "../../permissions/useModulePermission";
import { toastApiError, toastApiInfo } from "../../../services/toast/apiToast";
import { downloadProjectReport } from "../services/projectReportApi";
import { primaryBtnClass, secondaryBtnClass } from "./surveyDetailsShared";
import {
  openProjectReportView,
  PROJECT_REPORT_TYPES,
} from "../utils/projectReportNavigation";

function ReportSection({ title, children, isDarkMode, headerAction }) {
  return (
    <TableCard title={title} isDarkMode={isDarkMode} headerAction={headerAction}>
      {children}
    </TableCard>
  );
}

function ReportActions({
  onView,
  onDownload,
  isDownloading,
  canDownload = false,
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <button type="button" className={secondaryBtnClass} onClick={onView}>
        View
      </button>
      {canDownload ? (
        <button
          type="button"
          className={primaryBtnClass}
          disabled={isDownloading}
          onClick={onDownload}
        >
          {isDownloading ? "Downloading..." : "Download"}
        </button>
      ) : null}
    </div>
  );
}

function ProjectReportTab({ isDarkMode, projectId, projectName, supplierId = "" }) {
  const { canDownload } = useModulePermission("survey");
  const [downloadingType, setDownloadingType] = useState("");

  const handleViewReport = (reportType) => {
    const resolvedProjectId = String(projectId ?? "").trim();
    if (!resolvedProjectId) {
      toastApiInfo({ message: "Project id is missing. Unable to open report." });
      return;
    }

    openProjectReportView({
      projectId: resolvedProjectId,
      reportType,
      projectName,
      supplierId,
    });
  };

  const handleDownloadReport = async (reportType) => {
    if (!canDownload) return;

    const resolvedProjectId = String(projectId ?? "").trim();
    if (!resolvedProjectId) {
      toastApiInfo({ message: "Project id is missing. Unable to download report." });
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
      <ReportSection
        title="Project Report"
        isDarkMode={isDarkMode}
        headerAction={
          <ReportActions
            onView={() => handleViewReport(PROJECT_REPORT_TYPES.PROJECT)}
            onDownload={() => handleDownloadReport(PROJECT_REPORT_TYPES.PROJECT)}
            isDownloading={downloadingType === PROJECT_REPORT_TYPES.PROJECT}
            canDownload={canDownload}
          />
        }
      />

      <ReportSection
        title="Pre-Screen Report"
        isDarkMode={isDarkMode}
        headerAction={
          <ReportActions
            onView={() => handleViewReport(PROJECT_REPORT_TYPES.PRESCREEN)}
            onDownload={() => handleDownloadReport(PROJECT_REPORT_TYPES.PRESCREEN)}
            isDownloading={downloadingType === PROJECT_REPORT_TYPES.PRESCREEN}
            canDownload={canDownload}
          />
        }
      />
    </div>
  );
}

export default ProjectReportTab;
