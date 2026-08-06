import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import AdminPagination from "../../../components/admin/AdminPagination";
import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import PermissionDenied from "../../../components/admin/PermissionDenied";
import PageErrorBoundary from "../../../components/shared/PageErrorBoundary";
import { PermissionsProvider } from "../../permissions/PermissionsContext";
import { useModulePermission } from "../../permissions/useModulePermission";
import ProjectReportTable from "../components/ProjectReportTable";
import { useProjectReportList } from "../hooks/useProjectReportList";
import {
  getProjectReportPageTitle,
  parseProjectReportSearch,
} from "../utils/projectReportNavigation";

function ProjectReportViewPageContent({ isDarkMode }) {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const { canRead: canReadSurvey } = useModulePermission("survey");

  const { reportType, supplierId, projectName } = useMemo(
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
    enabled: canReadSurvey,
  });

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

  return (
    <div className="admin-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="admin-text text-xl font-bold sm:text-2xl">{pageTitle}</h1>
        </header>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start">
          <DebouncedSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onDebouncedChange={handleSearch}
            placeholder="Search..."
            aria-label="Search report"
            maxWidthClass="w-full sm:max-w-xs"
          />
        </div>

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
