import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import AdminPagination from "../../../components/admin/AdminPagination";
import PermissionDenied from "../../../components/admin/PermissionDenied";
import PageErrorBoundary from "../../../components/shared/PageErrorBoundary";
import { PermissionsProvider } from "../../permissions/PermissionsContext";
import { useModulePermission } from "../../permissions/useModulePermission";
import ProjectReportTable from "../components/ProjectReportTable";
import ReportModeFilters from "../components/ReportModeFilters";
import { REPORT_MODE, REPORT_STATUS } from "../utils/reportFilterConstants";
import { useProjectReportList } from "../hooks/useProjectReportList";
import {
  listSupplierMappings,
  mapSupplierMappingToRow,
} from "../services/supplierMappingApi";
import {
  getProjectReportPageTitle,
  parseProjectReportSearch,
} from "../utils/projectReportNavigation";

function ProjectReportViewPageContent({ isDarkMode }) {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const { canRead: canReadSurvey } = useModulePermission("survey");

  const { reportType, supplierId, mode, status, startDate, endDate, projectName } = useMemo(
    () => parseProjectReportSearch(searchParams),
    [searchParams]
  );

  const pageTitle = useMemo(
    () => getProjectReportPageTitle({ reportType, projectName }),
    [reportType, projectName]
  );

  const {
    rows,
    totalRecords,
    totalPages,
    isLoading,
    currentPage,
    pageSize,
    listError,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  } = useProjectReportList({
    projectId,
    reportType,
    supplierId,
    mode,
    status,
    startDate,
    endDate,
    enabled: canReadSurvey,
  });

  useEffect(() => {
    let cancelled = false;
    const resolvedProjectId = String(projectId ?? "").trim();
    if (!resolvedProjectId) {
      setSupplierOptions([]);
      return undefined;
    }

    setIsLoadingSuppliers(true);
    listSupplierMappings({ projectId: resolvedProjectId })
      .then((records) => {
        if (cancelled) return;
        const seen = new Set();
        const options = [];
        (Array.isArray(records) ? records : [])
          .map((record, index) => mapSupplierMappingToRow(record, index))
          .forEach((row) => {
            const value = String(row.partnerId || row.partnerCode || "").trim();
            if (!value || seen.has(value)) return;
            seen.add(value);
            options.push({
              value,
              label:
                [row.partnerName, row.partnerCode].filter(Boolean).join(" — ") ||
                value,
            });
          });
        setSupplierOptions(options);
      })
      .catch(() => {
        if (!cancelled) setSupplierOptions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSuppliers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const paginationFooter = (
    <AdminPagination
      isDarkMode={isDarkMode}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalRecords}
      pageSize={pageSize}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      showWhenEmpty
    />
  );

  if (!canReadSurvey) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  function updateFilters({
    nextMode = mode,
    nextStatus = status,
    nextSupplierId = supplierId,
    nextStartDate = startDate,
    nextEndDate = endDate,
  } = {}) {
    const next = new URLSearchParams(searchParams);
    next.set("mode", nextMode === REPORT_MODE.TEST ? "test" : "live");
    const resolvedStatus = String(nextStatus ?? "").trim().toLowerCase();
    if (resolvedStatus && resolvedStatus !== REPORT_STATUS.ALL) {
      next.set("status", resolvedStatus);
    } else {
      next.delete("status");
    }
    if (nextSupplierId) next.set("supplierId", nextSupplierId);
    else next.delete("supplierId");
    if (nextStartDate) next.set("start_date", nextStartDate);
    else next.delete("start_date");
    if (nextEndDate) next.set("end_date", nextEndDate);
    else next.delete("end_date");
    next.delete("from_date");
    next.delete("to_date");
    setSearchParams(next);
    handlePageChange(1);
  }

  return (
    <div className="admin-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="admin-text text-xl font-bold sm:text-2xl">{pageTitle}</h1>
        </header>

        <ReportModeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onDebouncedSearch={handleSearch}
          status={status}
          onStatusChange={(nextStatus) => updateFilters({ nextStatus })}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={({ startDate: nextStartDate, endDate: nextEndDate }) =>
            updateFilters({ nextStartDate, nextEndDate })
          }
          supplierId={supplierId}
          onSupplierChange={(nextSupplierId) => updateFilters({ nextSupplierId })}
          supplierOptions={supplierOptions}
          isLoadingSuppliers={isLoadingSuppliers}
          mode={mode}
          onModeChange={(nextMode) => updateFilters({ nextMode })}
        />

        <ProjectReportTable
          rows={rows}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
          footer={paginationFooter}
          errorMessage={listError}
          reportType={reportType}
        />
      </div>
    </div>
  );
}

function ProjectReportViewPage({ isDarkMode }) {
  return (
    <PermissionsProvider>
      <div
        data-theme={isDarkMode ? "dark" : "light"}
        className="admin-shell min-h-screen bg-[var(--admin-shell-bg)]"
      >
        <PageErrorBoundary isDarkMode={isDarkMode}>
          <ProjectReportViewPageContent isDarkMode={isDarkMode} />
        </PageErrorBoundary>
      </div>
    </PermissionsProvider>
  );
}

export default ProjectReportViewPage;
