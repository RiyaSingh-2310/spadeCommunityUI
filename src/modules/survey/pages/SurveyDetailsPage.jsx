import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import PermissionDenied from "../../../components/admin/PermissionDenied";
import { useModulePermission } from "../../permissions/useModulePermission";
import {
  getRecord,
  mapSurveyToProjectDetails,
  updateSurveyStatus,
} from "../services/surveyApi";
import ProjectDetailsTab from "../components/ProjectDetailsTab";
import ProjectReportTab from "../components/ProjectReportTab";
import SupplierMappingTab from "../components/SupplierMappingTab";
import SurveyDetailsHeader, {
  SALES_PROJECT_DETAIL_TABS,
  SURVEY_DETAIL_TABS,
} from "../components/SurveyDetailsHeader";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function SurveyDetailsPage({ isDarkMode, salesViewMode = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canRead } = useModulePermission("survey");

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeTab, setActiveTab] = useState("project-details");
  const [projectStatus, setProjectStatus] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const visibleTabs = salesViewMode ? SALES_PROJECT_DETAIL_TABS : SURVEY_DETAIL_TABS;

  useEffect(() => {
    if (!id) {
      setProject(null);
      setIsLoading(false);
      setLoadFailed(true);
      return undefined;
    }

    let cancelled = false;

    const loadSurvey = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const record = await getRecord(id);
        if (cancelled) return;

        const mapped = mapSurveyToProjectDetails(record);
        if (!mapped) {
          throw new Error("");
        }

        setProject(mapped);
        setProjectStatus(mapped.projectStatus);
        setDraftStatus(mapped.projectStatus);
        setActiveTab("project-details");
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setProject(null);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSurvey();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? "project-details");
    }
  }, [activeTab, visibleTabs]);

  if (!canRead) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  const listPath = salesViewMode ? "/sales/projects" : "/survey";
  const listLabel = salesViewMode ? "Projects" : "Survey";

  const tabLabels = visibleTabs.reduce((acc, tab) => {
    acc[tab.id] = tab.label;
    return acc;
  }, /** @type {Record<string, string>} */ ({}));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Survey Details"
          subtitle={`Survey ${id}`}
          breadcrumbs={[
            { label: listLabel, to: listPath },
            { label: "Project Details" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (loadFailed || !project) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Survey Details"
          subtitle={`Survey ${id}`}
          breadcrumbs={[
            { label: listLabel, to: listPath },
            { label: "Project Details" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load survey details.
          <button
            type="button"
            onClick={() => navigate(listPath)}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Back to {listLabel}
          </button>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = async () => {
    const recordId = project.recordId ?? id;
    if (recordId == null) return;

    setIsUpdatingStatus(true);
    try {
      const data = await updateSurveyStatus(recordId, { status: draftStatus });
      toastApiSuccess(data);
      setProjectStatus(draftStatus);
    } catch (err) {
      toastApiError(err);
      setDraftStatus(projectStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={project.projectName}
        subtitle={`Survey ${project.surveyId || project.id}`}
        breadcrumbs={[
          { label: listLabel, to: listPath },
          { label: tabLabels[activeTab] ?? "Project Details" },
        ]}
        isDarkMode={isDarkMode}
      />

      <SurveyDetailsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        projectStatus={projectStatus}
        draftStatus={draftStatus}
        onStatusChange={setDraftStatus}
        onStatusUpdate={handleStatusUpdate}
        isUpdatingStatus={isUpdatingStatus}
        surveyId={project.surveyId || project.id}
        tabs={visibleTabs}
        readOnly={salesViewMode}
        onEditSurvey={() =>
          navigate(`/survey/edit/${encodeURIComponent(id)}`)
        }
      />

      <div role="tabpanel" aria-label={tabLabels[activeTab]}>
        {activeTab === "project-details" && (
          <ProjectDetailsTab project={project} isDarkMode={isDarkMode} />
        )}
        {!salesViewMode && activeTab === "supplier-mapping" && (
          <SupplierMappingTab surveyId={id} isDarkMode={isDarkMode} />
        )}
        {activeTab === "project-report" && (
          <ProjectReportTab isDarkMode={isDarkMode} />
        )}
      </div>
    </div>
  );
}

export default SurveyDetailsPage;
