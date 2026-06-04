import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import PermissionDenied from "../../../components/admin/PermissionDenied";
import { useModulePermission } from "../../permissions/useModulePermission";
import { getSurveyProjectDetails } from "../data/surveyDetailsData";
import { updateSurveyProjectStatus } from "../services/surveyApi";
import ProjectDetailsTab from "../components/ProjectDetailsTab";
import ProjectReportTab from "../components/ProjectReportTab";
import SupplierMappingTab from "../components/SupplierMappingTab";
import SurveyDetailsHeader from "../components/SurveyDetailsHeader";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function SurveyDetailsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canRead } = useModulePermission("survey");

  const project = useMemo(() => getSurveyProjectDetails(id), [id]);
  const [activeTab, setActiveTab] = useState("project-details");
  const [projectStatus, setProjectStatus] = useState(project.projectStatus);
  const [draftStatus, setDraftStatus] = useState(project.projectStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setProjectStatus(project.projectStatus);
    setDraftStatus(project.projectStatus);
  }, [project.projectStatus, id]);

  if (!canRead) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  const handleStatusUpdate = async () => {
    setIsUpdatingStatus(true);
    try {
      const data = await updateSurveyProjectStatus(id, draftStatus);
      toastApiSuccess(data);
      setProjectStatus(draftStatus);
    } catch (err) {
      toastApiError(err);
      setDraftStatus(projectStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const tabLabels = {
    "project-details": "Project Details",
    "supplier-mapping": "Supplier Mapping",
    "project-report": "Project Report",
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={project.projectName}
        subtitle={`Survey ${project.id}`}
        breadcrumbs={[
          { label: "Survey", to: "/survey" },
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
        surveyId={project.id}
        onEditSurvey={() =>
          navigate(`/survey/edit/${encodeURIComponent(id)}`)
        }
      />

      <div role="tabpanel" aria-label={tabLabels[activeTab]}>
        {activeTab === "project-details" && (
          <ProjectDetailsTab project={project} isDarkMode={isDarkMode} />
        )}
        {activeTab === "supplier-mapping" && (
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
