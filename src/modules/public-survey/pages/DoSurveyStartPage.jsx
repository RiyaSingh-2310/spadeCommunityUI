import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PublicQuestionnaireLayout from "../../public-questionnaire/layout/PublicQuestionnaireLayout";
import SurveyEmptyState from "../../public-questionnaire/components/SurveyEmptyState";
import {
  claimPartnerUrlTabAsAdminOpened,
  subscribePartnerUrlTabAdminLogout,
} from "../../survey/utils/partnerUrlTabSync";
import { toast } from "../../../services/toast";
import DoSurveyHero from "../components/DoSurveyHero";
import PreScreenQuestionnaire from "../components/PreScreenQuestionnaire";
import {
  fetchDoSurveyStartDetails,
  getSurveyLink,
  initiateSurveyStart,
  openCustomerSurveyUrl,
  toFlowErrorMessage,
} from "../services/doSurveyApi";
import { classifyDoSurveyError } from "../utils/doSurveyHelpers";
import {
  readDoSurveyTokenFromPath,
  readSurveyFlowParams,
  urlHasUidPlaceholder,
} from "../utils/surveyFlowParams";

const IS_TEST_QUERY_KEYS = ["IsTest", "isTest", "is_test"];
const INVALID_SURVEY_LINK_MESSAGE =
  "This survey link is invalid or incomplete. Please use the link provided by your survey partner.";
const UID_PLACEHOLDER_TOAST_MS = 8000;
const START_FLOW_ERROR = "Unable to start the survey.";
const LINK_FLOW_ERROR =
  "Unable to load the survey. Survey link is unavailable. Please try again later.";

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

  const [isSearchReady] = useState(true);
  const [urlSanitized, setUrlSanitized] = useState(false);
  const [isTestHint] = useState(() =>
    readIsTestFromSearch(
      typeof window !== "undefined" ? window.location.search : ""
    )
  );
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
  const uidInstructionToastKeyRef = useRef("");
  const startFlowInFlightRef = useRef(false);

  const flowParams = useMemo(
    () =>
      readSurveyFlowParams({
        token,
        search: searchParams.toString() || location.search,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, searchKey, location.search]
  );

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

    // Mark sanitized after optional URL rewrite so partner APIs can load.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot URL gate
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
  const hasUidPlaceholder = urlHasUidPlaceholder(
    searchParams.toString() || location.search
  );
  const uidBlocksStart = !hasValidUid || hasUidPlaceholder;
  const canLoadPartnerApis = isSearchReady && urlSanitized;

  // Instruct the respondent when Partner URL still has XXX / identifier.
  useEffect(() => {
    if (!isSearchReady || !urlSanitized) return;
    if (!uidBlocksStart) {
      uidInstructionToastKeyRef.current = "";
      return;
    }

    // Re-read window location so refresh / edited query is authoritative.
    const liveSearch =
      typeof window !== "undefined"
        ? window.location.search
        : searchParams.toString() || location.search;
    const toastKey = `${token}|${liveSearch}`;
    if (uidInstructionToastKeyRef.current === toastKey) return;
    uidInstructionToastKeyRef.current = toastKey;

    toast.warning(INVALID_SURVEY_LINK_MESSAGE, UID_PLACEHOLDER_TOAST_MS);
  }, [
    isSearchReady,
    urlSanitized,
    uidBlocksStart,
    searchKey,
    token,
    searchParams,
    location.search,
  ]);

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
    const fromPath = readDoSurveyTokenFromPath(
      typeof window !== "undefined" ? window.location.pathname : location.pathname
    );
    return String(fromPath || flowParams.token || token || "").trim();
  }

  async function redirectToSurveyLink(actionUid) {
    setIsRedirecting(true);
    const result = await getSurveyLink({
      token: getPartnerToken(),
      uid: actionUid,
    });
    const surveyUrl = String(result?.surveyUrl ?? "").trim();
    if (!surveyUrl) {
      throw new Error(LINK_FLOW_ERROR);
    }
    // Open the exact customer/vendor URL from the API — no React Router, no rewrite.
    openCustomerSurveyUrl(surveyUrl, result?.data ?? null);
  }

  async function handleStartSurvey() {
    if (
      startFlowInFlightRef.current ||
      isStarting ||
      isSubmittingPrescreen ||
      isRedirecting
    ) {
      return;
    }

    const actionUid = getActionUid();
    if (!actionUid || uidBlocksStart) {
      setStartError(INVALID_SURVEY_LINK_MESSAGE);
      return;
    }

    const partnerToken = getPartnerToken();
    if (!partnerToken) {
      setStartError("Missing survey token. Please use a valid partner survey link.");
      return;
    }

    startFlowInFlightRef.current = true;
    setStartError("");
    setPrescreenError("");
    setIsStarting(true);

    let reachedLinkStep = false;
    try {
      const result = await initiateSurveyStart({
        token: partnerToken,
        uid: actionUid,
      });

      if (result.prescreenRequired) {
        setPrescreen(result.prescreen);
        setShowPrescreen(true);
        setIsStarting(false);
        startFlowInFlightRef.current = false;
        return;
      }

      reachedLinkStep = true;
      await redirectToSurveyLink(actionUid);
      // Keep loading UI until the browser navigates away.
    } catch (error) {
      setStartError(
        toFlowErrorMessage(
          error,
          reachedLinkStep ? LINK_FLOW_ERROR : START_FLOW_ERROR
        )
      );
      setIsStarting(false);
      setIsRedirecting(false);
      startFlowInFlightRef.current = false;
    }
  }

  async function handlePrescreenSubmit() {
    if (
      startFlowInFlightRef.current ||
      isSubmittingPrescreen ||
      isRedirecting ||
      isStarting
    ) {
      return;
    }

    const actionUid = getActionUid();
    if (!actionUid) {
      setPrescreenError("Missing or Invalid UID in Link");
      return;
    }

    startFlowInFlightRef.current = true;
    setPrescreenError("");
    setIsSubmittingPrescreen(true);

    try {
      await redirectToSurveyLink(actionUid);
      // Keep loading UI until the browser navigates away.
    } catch (error) {
      setPrescreenError(toFlowErrorMessage(error, LINK_FLOW_ERROR));
      setIsSubmittingPrescreen(false);
      setIsRedirecting(false);
      startFlowInFlightRef.current = false;
    }
  }

  const pageReady = !isLoading && isSearchReady && urlSanitized;
  const showUidError =
    pageReady && !isLoading && isSearchReady && urlSanitized && uidBlocksStart;
  const flowBusy = isStarting || isSubmittingPrescreen || isRedirecting;

  return (
    <PublicQuestionnaireLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      {isLoading || !isSearchReady || !urlSanitized ? (
        <div className="pq-card pq-state-card pq-loading-card" aria-busy="true" aria-live="polite">
          <Loader2 className="pq-loading-spinner" size={32} aria-hidden />
          <p className="pq-loading-text">Preparing your survey...</p>
        </div>
      ) : null}

      {(isStarting || isRedirecting) && !showPrescreen ? (
        <div className="pq-card pq-state-card pq-loading-card" aria-busy="true" aria-live="polite">
          <Loader2 className="pq-loading-spinner" size={32} aria-hidden />
          <p className="pq-loading-text">Starting your survey...</p>
          <p className="pq-loading-text">Please wait...</p>
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

      {pageReady && survey && !showPrescreen && !isStarting && !isRedirecting ? (
        <>
          <DoSurveyHero
            survey={survey}
            onStart={handleStartSurvey}
            disabled={showUidError || flowBusy}
            isStarting={isStarting || isRedirecting}
            disabledTitle={
              showUidError ? INVALID_SURVEY_LINK_MESSAGE : ""
            }
          />
          {showUidError ? (
            <p className="pq-hero-error" role="alert">
              {INVALID_SURVEY_LINK_MESSAGE}
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
