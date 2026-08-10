import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PublicQuestionnaireLayout from "../../public-questionnaire/layout/PublicQuestionnaireLayout";
import SurveyEmptyState from "../../public-questionnaire/components/SurveyEmptyState";
import {
  claimPartnerUrlTabAsAdminOpened,
  subscribePartnerUrlTabAdminLogout,
} from "../../survey/utils/partnerUrlTabSync";
import { replaceSurveyLinkPlaceholders } from "../../survey/utils/surveyLinkPlaceholders";
import DoSurveyHero from "../components/DoSurveyHero";
import PreScreenQuestionnaire from "../components/PreScreenQuestionnaire";
import {
  fetchDoSurveyStartDetails,
  fetchSurveyLink,
  initiateSurveyStart,
} from "../services/doSurveyApi";
import { classifyDoSurveyError } from "../utils/doSurveyHelpers";
import { readSurveyFlowParams } from "../utils/surveyFlowParams";

const IS_TEST_QUERY_KEYS = ["IsTest", "isTest", "is_test"];

function readIsTestFromSearch(search) {
  const query = String(search ?? "").startsWith("?")
    ? String(search).slice(1)
    : String(search ?? "");
  if (!query) return undefined;

  try {
    const params = new URLSearchParams(query);
    for (const key of IS_TEST_QUERY_KEYS) {
      const value = params.get(key);
      if (value != null && value !== "") return value;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/**
 * Public survey entry / validation gateway.
 * Flow: Survey URL → validation → Pre-Screen → Customer Survey → Redirect outcomes.
 * Reads Project ID, Project URL ID/Code, UID, Partner ID, Token from the URL dynamically.
 */
function DoSurveyStartPage({ isDarkMode, onToggleTheme }) {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();

  const [isSearchReady, setIsSearchReady] = useState(false);
  const [urlSanitized, setUrlSanitized] = useState(false);
  const [isTestHint, setIsTestHint] = useState(undefined);
  const [survey, setSurvey] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [startError, setStartError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const [prescreen, setPrescreen] = useState(null);
  const [showPrescreen, setShowPrescreen] = useState(false);
  const [isSubmittingPrescreen, setIsSubmittingPrescreen] = useState(false);
  const [prescreenError, setPrescreenError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const flowParams = useMemo(
    () =>
      readSurveyFlowParams({
        token,
        search: searchParams.toString() || location.search,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, searchKey, location.search]
  );

  useEffect(() => {
    setIsSearchReady(true);
  }, [location.search, searchParams]);

  /**
   * Mark this tab when opened from Admin Partner Mapping, then close on Admin logout.
   */
  useEffect(() => {
    claimPartnerUrlTabAsAdminOpened({
      token,
      hasAdminVerifyIntent: false,
    });

    return subscribePartnerUrlTabAdminLogout(() => {
      window.setTimeout(() => {
        window.close();
      }, 0);
    });
  }, [token]);

  // Strip IsTest from the address bar after capture; keep all flow identifiers.
  useEffect(() => {
    if (!isSearchReady || urlSanitized) return;

    const params = new URLSearchParams(location.search);
    const captured = readIsTestFromSearch(location.search);
    if (captured !== undefined) {
      setIsTestHint(captured);
    }

    let changed = false;
    IS_TEST_QUERY_KEYS.forEach((key) => {
      if (params.has(key)) {
        params.delete(key);
        changed = true;
      }
    });

    if (changed) {
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true }
      );
    }

    setUrlSanitized(true);
  }, [
    isSearchReady,
    urlSanitized,
    location.pathname,
    location.search,
    navigate,
  ]);

  const respondentUid = flowParams.uid;
  const hasValidUid = Boolean(respondentUid);
  const canLoadPartnerApis = isSearchReady && urlSanitized;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const normalizedToken = String(flowParams.token || token || "").trim();
      if (!normalizedToken) {
        setSurvey(null);
        setLoadError("Missing survey token. Please use a valid partner survey link.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError("");
      setStartError("");
      setIsStarting(false);
      setPrescreen(null);
      setShowPrescreen(false);
      setPrescreenError("");
      setIsSubmittingPrescreen(false);
      setIsRedirecting(false);

      try {
        const data = await fetchDoSurveyStartDetails(normalizedToken, {
          uid: respondentUid,
          isTest: isTestHint,
          projectId: flowParams.projectId,
          projectUrlId: flowParams.projectUrlId,
          projectUrlCode: flowParams.projectUrlCode,
          partnerId: flowParams.partnerId,
        });
        if (!cancelled) {
          setSurvey(data);
        }
      } catch (error) {
        if (!cancelled) {
          setSurvey(null);
          setLoadError(
            String(error?.message ?? "").trim() ||
              "Unable to load this survey. Please try again later."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (!canLoadPartnerApis) {
      return () => {
        cancelled = true;
      };
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [
    token,
    canLoadPartnerApis,
    respondentUid,
    isTestHint,
    flowParams.token,
    flowParams.projectId,
    flowParams.projectUrlId,
    flowParams.projectUrlCode,
    flowParams.partnerId,
  ]);

  const errorVariant = classifyDoSurveyError(loadError);

  function getActionUid() {
    const fromFlow = readSurveyFlowParams({
      token,
      search: searchParams.toString() || location.search,
    }).uid;
    if (fromFlow) return fromFlow;
    if (typeof window !== "undefined") {
      return readSurveyFlowParams({
        token,
        search: window.location.search,
      }).uid;
    }
    return "";
  }

  function getPartnerToken() {
    return String(flowParams.token || token || "").trim();
  }

  async function redirectToSurveyLink(actionUid) {
    setIsRedirecting(true);
    const result = await fetchSurveyLink({
      token: getPartnerToken(),
      uid: actionUid,
      projectId: flowParams.projectId,
      projectUrlId: flowParams.projectUrlId,
      projectUrlCode: flowParams.projectUrlCode,
      partnerId: flowParams.partnerId,
    });
    const rawSurveyUrl = String(result?.surveyUrl ?? "").trim();
    if (!rawSurveyUrl) {
      throw new Error("Survey URL missing from response. Please try again.");
    }
    // Replace identifier / XXX placeholders with the real respondent UID.
    const surveyUrl = replaceSurveyLinkPlaceholders(rawSurveyUrl, actionUid);
    window.location.assign(surveyUrl);
  }

  async function handleStartSurvey() {
    if (isStarting || isSubmittingPrescreen || isRedirecting) {
      return;
    }

    const actionUid = getActionUid();
    if (!actionUid) {
      setStartError("Missing or Invalid UID in Link");
      return;
    }

    const partnerToken = getPartnerToken();
    if (!partnerToken) {
      setStartError("Missing survey token. Please use a valid partner survey link.");
      return;
    }

    setStartError("");
    setPrescreenError("");
    setIsStarting(true);

    try {
      const result = await initiateSurveyStart({
        token: partnerToken,
        uid: actionUid,
        projectId: flowParams.projectId,
        projectUrlId: flowParams.projectUrlId,
        projectUrlCode: flowParams.projectUrlCode,
        partnerId: flowParams.partnerId,
      });

      if (result.prescreenRequired) {
        setPrescreen(result.prescreen);
        setShowPrescreen(true);
        setIsStarting(false);
        return;
      }

      await redirectToSurveyLink(actionUid);
    } catch (error) {
      setStartError(
        String(error?.message ?? "").trim() ||
          "Unable to start the survey right now. Please try again."
      );
      setIsStarting(false);
      setIsRedirecting(false);
    }
  }

  async function handlePrescreenSubmit() {
    if (isSubmittingPrescreen || isRedirecting || isStarting) return;

    const actionUid = getActionUid();
    if (!actionUid) {
      setPrescreenError("Missing or Invalid UID in Link");
      return;
    }

    setPrescreenError("");
    setIsSubmittingPrescreen(true);

    try {
      await redirectToSurveyLink(actionUid);
    } catch (error) {
      setPrescreenError(
        String(error?.message ?? "").trim() ||
          "Unable to load the survey link. Please try again."
      );
      setIsSubmittingPrescreen(false);
      setIsRedirecting(false);
    }
  }

  const pageReady = !isLoading && isSearchReady && urlSanitized;
  const showUidError =
    pageReady && !isLoading && isSearchReady && urlSanitized && !hasValidUid;
  const flowBusy = isStarting || isSubmittingPrescreen || isRedirecting;

  return (
    <PublicQuestionnaireLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      {isLoading || !isSearchReady || !urlSanitized ? (
        <div className="pq-card pq-state-card pq-loading-card" aria-busy="true" aria-live="polite">
          <Loader2 className="pq-loading-spinner" size={32} aria-hidden />
          <p className="pq-loading-text">Preparing your survey...</p>
        </div>
      ) : null}

      {isRedirecting && !showPrescreen ? (
        <div className="pq-card pq-state-card pq-loading-card" aria-busy="true" aria-live="polite">
          <Loader2 className="pq-loading-spinner" size={32} aria-hidden />
          <p className="pq-loading-text">Opening your survey...</p>
        </div>
      ) : null}

      {pageReady && !survey ? (
        <SurveyEmptyState
          variant={errorVariant}
          description={loadError || undefined}
        />
      ) : null}

      {pageReady && survey && showPrescreen && prescreen ? (
        <PreScreenQuestionnaire
          prescreen={prescreen}
          onSubmit={handlePrescreenSubmit}
          isSubmitting={isSubmittingPrescreen || isRedirecting}
          submitError={prescreenError}
        />
      ) : null}

      {pageReady && survey && !showPrescreen && !isRedirecting ? (
        <>
          <DoSurveyHero
            survey={survey}
            onStart={handleStartSurvey}
            disabled={showUidError || flowBusy}
            isStarting={isStarting || isRedirecting}
          />
          {showUidError ? (
            <p className="pq-hero-error" role="alert">
              Missing or Invalid UID in Link
            </p>
          ) : null}
          {startError ? (
            <p className="pq-hero-error" role="alert">
              {startError}
            </p>
          ) : null}
        </>
      ) : null}
    </PublicQuestionnaireLayout>
  );
}

export default DoSurveyStartPage;
