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
import {
  classifyDoSurveyError,
  interpretSurveyStartAccess,
} from "../utils/doSurveyHelpers";
import {
  readDoSurveyTokenFromPath,
  readSurveyFlowParams,
  urlHasUidPlaceholder,
  getSurveyOutcomeKeyFromUrl,
  getSurveyOutcomePath,
  normalizeSurveyOutcomeKey,
} from "../utils/surveyFlowParams";
import {
  markSurveyFlowCompleted,
  readSurveyFlowCompleted,
} from "../utils/surveyFlowCompletion";

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
  const [startBlocked, setStartBlocked] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const [prescreen, setPrescreen] = useState(null);
  const [showPrescreen, setShowPrescreen] = useState(false);
  const [isSubmittingPrescreen, setIsSubmittingPrescreen] = useState(false);
  const [prescreenError, setPrescreenError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const uidInstructionToastKeyRef = useRef("");
  const startFlowInFlightRef = useRef(false);
  const activityReadyRef = useRef(false);
  const notifiedMessageRef = useRef("");

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
  const partnerTokenForGate = String(flowParams.token || token || "").trim();

  function notifyOnce(message, type = "warning") {
    const text = String(message ?? "").trim();
    if (!text) return;
    if (notifiedMessageRef.current === text) return;
    notifiedMessageRef.current = text;
    if (type === "error") {
      toast.error(text, { force: true });
      return;
    }
    toast.warning(text, {
      force: true,
      duration: type === "uid" ? UID_PLACEHOLDER_TOAST_MS : undefined,
    });
  }

  // If this token+uid already completed, stay on the result page (no restart).
  useEffect(() => {
    if (!canLoadPartnerApis || !partnerTokenForGate || !respondentUid) return;

    const completed = readSurveyFlowCompleted({
      token: partnerTokenForGate,
      uid: respondentUid,
    });
    if (!completed) return;

    const resultPath = getSurveyOutcomePath(completed.outcome, respondentUid);
    if (!resultPath) return;
    if (location.pathname === resultPath) return;

    navigate(resultPath, { replace: true });
  }, [
    canLoadPartnerApis,
    partnerTokenForGate,
    respondentUid,
    navigate,
    location.pathname,
  ]);

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

    notifyOnce(INVALID_SURVEY_LINK_MESSAGE, "uid");
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
        const message = "Missing survey token. Please use a valid partner survey link.";
        setSurvey(null);
        setLoadError(message);
        setIsLoading(false);
        notifyOnce(message, "error");
        return;
      }

      setIsLoading(true);
      setLoadError("");
      setStartError("");
      setStartBlocked(false);
      setIsStarting(false);
      setPrescreen(null);
      setShowPrescreen(false);
      setPrescreenError("");
      setIsSubmittingPrescreen(false);
      setIsRedirecting(false);
      activityReadyRef.current = false;
      notifiedMessageRef.current = "";

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
          const message =
            String(error?.message ?? "").trim() ||
            "Unable to load this survey. Please try again later.";
          setLoadError(message);
          notifyOnce(message, "error");
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
    const partnerToken = getPartnerToken();
    const result = await getSurveyLink({
      token: partnerToken,
      uid: actionUid,
    });
    const surveyUrl = String(result?.surveyUrl ?? "").trim();
    if (!surveyUrl) {
      throw new Error(LINK_FLOW_ERROR);
    }

    // Live/Test link may be a configured Complete/Terminate/Quota redirect
    // (often hardcoded to production). Never follow that externally — use the
    // in-app result route on the current origin with the real UID.
    const outcomeKey =
      result?.outcomeKey ||
      getSurveyOutcomeKeyFromUrl(surveyUrl) ||
      normalizeSurveyOutcomeKey(
        result?.data?.Status ??
          result?.data?.status ??
          result?.data?.surveyStatus ??
          result?.data?.outcome
      );
    if (outcomeKey) {
      markSurveyFlowCompleted({
        token: partnerToken,
        uid: actionUid,
        outcome: outcomeKey,
      });
      const resultPath = getSurveyOutcomePath(outcomeKey, actionUid);
      if (!resultPath) {
        throw new Error(LINK_FLOW_ERROR);
      }
      navigate(resultPath, { replace: true });
      return;
    }

    // Real customer/vendor survey URL — leave this app.
    openCustomerSurveyUrl(surveyUrl, result?.data ?? null);
  }

  async function handleStartSurvey() {
    if (
      startFlowInFlightRef.current ||
      isStarting ||
      isSubmittingPrescreen ||
      isRedirecting ||
      startBlocked ||
      isLoading
    ) {
      return;
    }

    const actionUid = getActionUid();
    if (!actionUid || uidBlocksStart) {
      setStartError(INVALID_SURVEY_LINK_MESSAGE);
      notifyOnce(INVALID_SURVEY_LINK_MESSAGE, "uid");
      return;
    }

    const partnerToken = getPartnerToken();
    if (!partnerToken) {
      const message = "Missing survey token. Please use a valid partner survey link.";
      setStartError(message);
      notifyOnce(message, "error");
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
        skipActivity: activityReadyRef.current,
      });
      activityReadyRef.current = true;

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
      const access = interpretSurveyStartAccess(error);
      const message = toFlowErrorMessage(
        error,
        reachedLinkStep ? LINK_FLOW_ERROR : START_FLOW_ERROR
      );
      const blocked = Boolean(error?.surveyStartBlocked) || access.blocked;
      setStartError(message);
      if (blocked) {
        setStartBlocked(true);
        notifyOnce(message, "warning");
      } else {
        notifyOnce(message, "error");
      }
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
      isStarting ||
      startBlocked
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
      const access = interpretSurveyStartAccess(error);
      const message = toFlowErrorMessage(error, LINK_FLOW_ERROR);
      const blocked = Boolean(error?.surveyStartBlocked) || access.blocked;
      setPrescreenError(message);
      if (blocked) {
        setStartBlocked(true);
        setStartError(message);
        setShowPrescreen(false);
        notifyOnce(message, "warning");
      } else {
        notifyOnce(message, "error");
      }
      setIsSubmittingPrescreen(false);
      setIsRedirecting(false);
      startFlowInFlightRef.current = false;
    }
  }

  const pageReady = !isLoading && isSearchReady && urlSanitized;
  const showUidError =
    pageReady && !isLoading && isSearchReady && urlSanitized && uidBlocksStart;
  const flowBusy = isStarting || isSubmittingPrescreen || isRedirecting || isLoading;
  const inlineStatusMessage = showUidError
    ? INVALID_SURVEY_LINK_MESSAGE
    : startError;
  const startDisabled = showUidError || startBlocked || flowBusy;
  const statusVariant = startBlocked || showUidError ? "warning" : "error";

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
        <DoSurveyHero
          survey={survey}
          onStart={handleStartSurvey}
          disabled={startDisabled}
          isStarting={isStarting || isRedirecting}
          disabledTitle={inlineStatusMessage}
          statusMessage={inlineStatusMessage}
          statusVariant={statusVariant}
        />
      ) : null}
    </PublicQuestionnaireLayout>
  );
}

export default DoSurveyStartPage;
