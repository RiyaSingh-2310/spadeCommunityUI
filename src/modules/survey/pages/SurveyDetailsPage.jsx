import { useCallback, useEffect, useMemo, useState } from "react";
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
import ProjectMultiUrlTab from "../components/ProjectMultiUrlTab";
// import ProjectReportTab from "../components/ProjectReportTab";
import ProjectUrlsTab from "../components/ProjectUrlsTab";
// import SupplierMappingTab from "../components/SupplierMappingTab";
import SurveyDetailsHeader, {
  getSurveyDetailTabs,
} from "../components/SurveyDetailsHeader";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  getGroupProjectEditPath,
  getGroupProjectsPath,
  getGroupSurveyBreadcrumbs,
} from "../utils/groupSurveyNavigation";

function isMultiLinkProject(project) {
  return String(project?.projectLinkType ?? "")
    .toLowerCase()
    .includes("multi");
}

function hasSavedProjectUrl(project) {
  const urls = Array.isArray(project?.urlInfo) ? project.urlInfo : [];
  return urls.length > 0;
}

function SurveyDetailsPage({ isDarkMode, salesViewMode = false }) {
  const navigate = useNavigate();
  const { id, groupId } = useParams();
  const isGroupView = Boolean(groupId);
  const { canRead: canReadSurvey } = useModulePermission("survey");
  const { canRead: canReadGroupSurvey } = useModulePermission("group_survey");
  const canRead = canReadSurvey || (isGroupView && canReadGroupSurvey);

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeTab, setActiveTab] = useState("project-details");
  const [projectStatus, setProjectStatus] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [projectUrlSaved, setProjectUrlSaved] = useState(false);
  const [savedProjectUrlId, setSavedProjectUrlId] = useState("");

  const isMultiLink = isMultiLinkProject(project);
  const multiUrlEnabled =
    Boolean(projectUrlSaved) || hasSavedProjectUrl(project);

  const visibleTabs = useMemo(
    () =>
      getSurveyDetailTabs({
        isMultiLink,
        multiUrlEnabled,
        salesViewMode,
      }),
    [isMultiLink, multiUrlEnabled, salesViewMode]
  );

  const loadSurvey = useCallback(
    async ({ silent = false } = {}) => {
      if (!id) {
        setProject(null);
        setIsLoading(false);
        setLoadFailed(true);
        return null;
      }

      if (!silent) setIsLoading(true);
      setLoadFailed(false);

      try {
        const record = await getRecord(id);
        const mapped = mapSurveyToProjectDetails(record);
        if (!mapped) {
          throw new Error("");
        }

        setProject(mapped);
        setProjectStatus(mapped.projectStatus);
        setDraftStatus(mapped.projectStatus);
        if (hasSavedProjectUrl(mapped)) {
          setProjectUrlSaved(true);
          const urlInfo = Array.isArray(mapped.urlInfo) ? mapped.urlInfo : [];
          const nextId =
            urlInfo[0]?.id ??
            urlInfo[0]?.url_id ??
            urlInfo[0]?.project_url_id ??
            "";
          if (nextId != null && nextId !== "") {
            setSavedProjectUrlId(String(nextId));
          }
        }
        if (!silent) setActiveTab("project-details");
        return mapped;
      } catch (error) {
        toastApiError(error);
        setProject(null);
        setLoadFailed(true);
        return null;
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    const load = async () => {
      await loadSurvey();
    };

    load();
  }, [loadSurvey]);

  useEffect(() => {
    const active = visibleTabs.find((tab) => tab.id === activeTab);
    if (!active || active.disabled) {
      setActiveTab(visibleTabs[0]?.id ?? "project-details");
    }
  }, [activeTab, visibleTabs]);

  if (!canRead) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  const tabLabels = visibleTabs.reduce((acc, tab) => {
    acc[tab.id] = tab.label;
    return acc;
  }, /** @type {Record<string, string>} */ ({}));

  const listPath = salesViewMode
    ? "/sales/projects"
    : isGroupView
      ? getGroupProjectsPath(groupId)
      : "/survey";
  const listLabel = salesViewMode
    ? "Projects"
    : isGroupView
      ? "Group Survey"
      : "Projects";

  const breadcrumbs = isGroupView
    ? getGroupSurveyBreadcrumbs(groupId, {
        currentLabel: tabLabels[activeTab] ?? "Project Details",
      })
    : [
        { label: listLabel, to: listPath },
        { label: tabLabels[activeTab] ?? "Project Details" },
      ];

  const loadingBreadcrumbs = isGroupView
    ? getGroupSurveyBreadcrumbs(groupId, { currentLabel: "Project Details" })
    : [
        { label: listLabel, to: listPath },
        { label: "Project Details" },
      ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Project Details"
          subtitle={`Project ${id}`}
          breadcrumbs={loadingBreadcrumbs}
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
          title="Project Details"
          subtitle={`Project ${id}`}
          breadcrumbs={loadingBreadcrumbs}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load project details.
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
      await loadSurvey({ silent: true });
    } catch (err) {
      toastApiError(err);
      setDraftStatus(projectStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleProjectUrlSaved = async (payload = {}) => {
    setProjectUrlSaved(true);
    const mapped = await loadSurvey({ silent: true });
    const urlInfo = Array.isArray(mapped?.urlInfo) ? mapped.urlInfo : [];
    const fromReload =
      urlInfo[0]?.id ??
      urlInfo[0]?.url_id ??
      urlInfo[0]?.project_url_id ??
      "";
    const resolvedUrlId =
      payload?.projectUrlId ||
      fromReload ||
      savedProjectUrlId ||
      `url-${project?.recordId ?? id}`;
    setSavedProjectUrlId(String(resolvedUrlId));

    if (isMultiLinkProject(mapped ?? project) || isMultiLink) {
      setActiveTab("project-multi-url");
    }
  };

  const handleTabChange = (tabId) => {
    const target = visibleTabs.find((tab) => tab.id === tabId);
    if (!target || target.disabled) return;
    setActiveTab(tabId);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Project Details"
        subtitle={`${project.projectName} · ${project.projectCode || project.surveyId || project.id}`}
        breadcrumbs={breadcrumbs}
        isDarkMode={isDarkMode}
      />

      <SurveyDetailsHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        projectStatus={projectStatus}
        draftStatus={draftStatus}
        onStatusChange={setDraftStatus}
        onStatusUpdate={handleStatusUpdate}
        isUpdatingStatus={isUpdatingStatus}
        surveyId={project.projectCode || project.surveyId || project.id}
        tabs={visibleTabs}
        readOnly={salesViewMode}
        onEditSurvey={() => {
          if (isGroupView) {
            const editTarget = getGroupProjectEditPath(id, groupId);
            navigate(editTarget.pathname, { state: editTarget.state });
            return;
          }
          navigate(`/survey/edit/${encodeURIComponent(id)}`);
        }}
      />

      <div role="tabpanel" aria-label={tabLabels[activeTab]}>
        {activeTab === "project-details" && (
          <ProjectDetailsTab project={project} isDarkMode={isDarkMode} />
        )}
        {!salesViewMode && activeTab === "project-urls" && (
          <ProjectUrlsTab
            surveyId={id}
            project={project}
            isDarkMode={isDarkMode}
            onSaved={handleProjectUrlSaved}
          />
        )}
        {!salesViewMode && activeTab === "project-multi-url" && multiUrlEnabled && (
          <ProjectMultiUrlTab
            project={project}
            projectUrlId={savedProjectUrlId}
            isDarkMode={isDarkMode}
          />
        )}
        {/* {!salesViewMode && activeTab === "supplier-mapping" && (
          <SupplierMappingTab surveyId={id} isDarkMode={isDarkMode} />
        )} */}
        {/* {activeTab === "project-report" && (
          <ProjectReportTab isDarkMode={isDarkMode} />
        )} */}
      </div>
    </div>
  );
}

export default SurveyDetailsPage;
