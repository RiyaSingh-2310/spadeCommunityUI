import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import {
  getSurveyDetailsBasePath,
  getSurveyDetailsBreadcrumbs,
  parseSurveyDetailsSearch,
  PROJECT_URL_VIEW_IDS,
  SURVEY_DETAIL_TAB_IDS,
} from "../utils/surveyDetailsNavigation";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const isGroupView = Boolean(groupId);
  const { canRead: canReadSurvey } = useModulePermission("survey");
  const { canRead: canReadGroupSurvey } = useModulePermission("group_survey");
  const canRead = canReadSurvey || (isGroupView && canReadGroupSurvey);

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [projectStatus, setProjectStatus] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [projectUrlSaved, setProjectUrlSaved] = useState(false);
  const [savedProjectUrlId, setSavedProjectUrlId] = useState("");

  const parsedSearch = useMemo(
    () => parseSurveyDetailsSearch(searchParams),
    [searchParams]
  );

  const isMultiLink = isMultiLinkProject(project);
  const multiUrlEnabled =
    Boolean(projectUrlSaved) || hasSavedProjectUrl(project);

  const visibleTabs = useMemo(
    () =>
      getSurveyDetailTabs({
        isMultiLink,
        multiUrlEnabled,
      }),
    [isMultiLink, multiUrlEnabled]
  );

  const activeTab = useMemo(() => {
    const requested = parsedSearch.tab;
    const match = visibleTabs.find((tab) => tab.id === requested && !tab.disabled);
    return match?.id ?? visibleTabs[0]?.id ?? SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS;
  }, [parsedSearch.tab, visibleTabs]);

  const urlView =
    activeTab === SURVEY_DETAIL_TAB_IDS.PROJECT_URLS
      ? parsedSearch.urlView
      : PROJECT_URL_VIEW_IDS.LIST;
  const urlId =
    activeTab === SURVEY_DETAIL_TAB_IDS.PROJECT_URLS ? parsedSearch.urlId : "";

  const detailsBasePath = useMemo(
    () =>
      getSurveyDetailsBasePath({
        id,
        groupId,
        salesViewMode,
      }),
    [id, groupId, salesViewMode]
  );

  const syncSearch = useCallback(
    (
      { tab, urlView: nextUrlView, urlId: nextUrlId } = {},
      { replace = false } = {}
    ) => {
      const nextTab = tab ?? activeTab;
      const params = new URLSearchParams();

      if (nextTab && nextTab !== SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS) {
        params.set("tab", nextTab);
      }

      if (nextTab === SURVEY_DETAIL_TAB_IDS.PROJECT_URLS) {
        const view = nextUrlView ?? PROJECT_URL_VIEW_IDS.LIST;
        if (
          view === PROJECT_URL_VIEW_IDS.ADD ||
          view === PROJECT_URL_VIEW_IDS.EDIT
        ) {
          params.set("urlView", view);
          if (view === PROJECT_URL_VIEW_IDS.EDIT && nextUrlId) {
            params.set("urlId", String(nextUrlId));
          }
        }
      }

      const next = params.toString();
      const current = searchParams.toString();
      if (next === current) return;
      setSearchParams(params, { replace });
    },
    [activeTab, searchParams, setSearchParams]
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
            urlInfo[0]?.url_id ??
            urlInfo[0]?.Url_Id ??
            urlInfo[0]?.project_url_id ??
            urlInfo[0]?.id ??
            "";
          if (nextId != null && nextId !== "") {
            setSavedProjectUrlId(String(nextId));
          }
        }
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

  // Keep invalid / disabled tab selections in sync with the URL.
  useEffect(() => {
    if (!id || isLoading) return;
    if (parsedSearch.tab === activeTab) return;
    syncSearch(
      {
        tab: activeTab,
        urlView: PROJECT_URL_VIEW_IDS.LIST,
        urlId: "",
      },
      { replace: true }
    );
  }, [id, isLoading, parsedSearch.tab, activeTab, syncSearch]);

  const handleProjectUrlViewChange = useCallback(
    ({ urlView: nextView, urlId: nextUrlId } = {}) => {
      syncSearch({
        tab: SURVEY_DETAIL_TAB_IDS.PROJECT_URLS,
        urlView: nextView ?? PROJECT_URL_VIEW_IDS.LIST,
        urlId: nextUrlId ?? "",
      });
    },
    [syncSearch]
  );

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

  const currentTabLabel = tabLabels[activeTab] ?? "Project Information";

  const breadcrumbs = isGroupView
    ? (() => {
        const base = getGroupSurveyBreadcrumbs(groupId, {
          currentLabel: undefined,
        });
        const detailCrumbs = getSurveyDetailsBreadcrumbs({
          listPath: getGroupProjectsPath(groupId),
          listLabel: "View Projects",
          detailsPath: detailsBasePath,
          tab: activeTab,
          tabLabel: currentTabLabel,
          urlView,
        });
        // Replace the first crumb from detail helper (View Projects) — already in base.
        return [...base, ...detailCrumbs.slice(1)];
      })()
    : getSurveyDetailsBreadcrumbs({
        listPath,
        listLabel,
        detailsPath: detailsBasePath,
        tab: activeTab,
        tabLabel: currentTabLabel,
        urlView,
      });

  const loadingBreadcrumbs = isGroupView
    ? getGroupSurveyBreadcrumbs(groupId, { currentLabel: "Project Information" })
    : [
        { label: listLabel, to: listPath },
        { label: "Project Information" },
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
      urlInfo[0]?.url_id ??
      urlInfo[0]?.Url_Id ??
      urlInfo[0]?.project_url_id ??
      urlInfo[0]?.id ??
      "";
    const resolvedUrlId =
      payload?.projectUrlId ||
      fromReload ||
      savedProjectUrlId ||
      `url-${project?.recordId ?? id}`;
    setSavedProjectUrlId(String(resolvedUrlId));

    syncSearch({
      tab: SURVEY_DETAIL_TAB_IDS.PROJECT_URLS,
      urlView: PROJECT_URL_VIEW_IDS.LIST,
      urlId: "",
    });
  };

  const handleTabChange = (tabId) => {
    const target = visibleTabs.find((tab) => tab.id === tabId);
    if (!target || target.disabled) return;
    syncSearch({
      tab: tabId,
      urlView: PROJECT_URL_VIEW_IDS.LIST,
      urlId: "",
    });
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
            const editTarget = getGroupProjectEditPath(id, groupId, {
              from: "details",
              fromTab: activeTab,
            });
            navigate(
              {
                pathname: editTarget.pathname,
                search: editTarget.search,
              },
              { state: editTarget.state }
            );
            return;
          }
          navigate(
            {
              pathname: `/survey/edit/${encodeURIComponent(id)}`,
              search: `?from=details&fromTab=${encodeURIComponent(activeTab)}`,
            },
            {
              state: { from: "details", fromTab: activeTab },
            }
          );
        }}
      />

      <div role="tabpanel" aria-label={tabLabels[activeTab]}>
        {activeTab === SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS && (
          <ProjectDetailsTab project={project} isDarkMode={isDarkMode} />
        )}
        {activeTab === SURVEY_DETAIL_TAB_IDS.PROJECT_URLS && (
          <ProjectUrlsTab
            key={`project-urls-${id}`}
            surveyId={id}
            project={project}
            isDarkMode={isDarkMode}
            urlView={urlView}
            urlId={urlId}
            onViewChange={handleProjectUrlViewChange}
            onSaved={salesViewMode ? undefined : handleProjectUrlSaved}
          />
        )}
        {activeTab === SURVEY_DETAIL_TAB_IDS.PROJECT_MULTI_URL &&
          multiUrlEnabled && (
            <ProjectMultiUrlTab
              project={project}
              projectUrlId={savedProjectUrlId}
              isDarkMode={isDarkMode}
            />
          )}
        {/* {activeTab === "supplier-mapping" && (
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
