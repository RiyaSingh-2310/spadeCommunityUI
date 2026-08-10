import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PublicQuestionnaireLayout from "../../public-questionnaire/layout/PublicQuestionnaireLayout";
import SurveyEmptyState from "../../public-questionnaire/components/SurveyEmptyState";
import PartnerUrlOtpVerificationModal from "../../survey/components/PartnerUrlOtpVerificationModal";
import {
  clearPartnerUrlVerifyContext,
  clearPartnerUrlVerifyPending,
  isPartnerUrlOtpVerified,
  markPartnerUrlOtpVerified,
  PARTNER_MAPPING_ID_QUERY_KEY,
  PARTNER_VERIFY_QUERY_KEY,
  readPartnerUrlVerifyPending,
  readPartnerVerifyIntentFromSearch,
  stashPartnerUrlVerifyPending,
} from "../../survey/utils/partnerUrlVerifyContext";
import {
  claimPartnerUrlTabAsAdminOpened,
  subscribePartnerUrlTabAdminLogout,
} from "../../survey/utils/partnerUrlTabSync";
import { clearSurveyAccessTempToken } from "../../survey/services/partnerUrlOtpApi";
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
const VERIFY_QUERY_KEYS = [PARTNER_VERIFY_QUERY_KEY, PARTNER_MAPPING_ID_QUERY_KEY];

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
 * Partner Mapping Partner URL → email OTP (when required) → Pre-Screen → Survey.
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

  const [verifyContext, setVerifyContext] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyIntentResolved, setVerifyIntentResolved] = useState(false);

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
    const urlIntent = readPartnerVerifyIntentFromSearch(
      searchParams,
      location.search
    );
    const pendingIntent = readPartnerUrlVerifyPending();
    claimPartnerUrlTabAsAdminOpened({
      token,
      hasAdminVerifyIntent: Boolean(
        urlIntent?.mappingId || pendingIntent?.mappingId
      ),
    });

    return subscribePartnerUrlTabAdminLogout(() => {
      window.setTimeout(() => {
        window.close();
      }, 0);
    });
  }, [token, searchKey, searchParams, location.search]);

  /**
   * Resolve partner email-verification intent from URL params / session stash.
   * Modal stays open until OTP success or Close.
   */
  useEffect(() => {
    if (!isSearchReady || verifyIntentResolved) return;

    const urlIntent = readPartnerVerifyIntentFromSearch(
      searchParams,
      location.search
    );
    const pendingIntent = readPartnerUrlVerifyPending();
    const intent = urlIntent || pendingIntent;

    if (!intent?.mappingId) {
      setVerifyContext(null);
      setShowVerifyModal(false);
      setIsEmailVerified(true);
      setVerifyIntentResolved(true);
      return;
    }

    const mappingId = intent.mappingId;
    if (isPartnerUrlOtpVerified(mappingId)) {
      setVerifyContext(null);
      setIsEmailVerified(true);
      setShowVerifyModal(false);
      setVerifyIntentResolved(true);
      clearPartnerUrlVerifyContext();
      return;
    }

    const partnerUrl =
      String(intent.partnerUrl ?? "").trim() ||
      `${location.pathname}${location.search}`;
    const nextContext = {
      ...intent,
      mappingId,
      partnerUrl,
      token: String(intent.token ?? token ?? "").trim(),
    };

    stashPartnerUrlVerifyPending(nextContext);
    setVerifyContext(nextContext);
    setIsEmailVerified(false);
    setShowVerifyModal(true);
    setVerifyIntentResolved(true);
  }, [
    isSearchReady,
    verifyIntentResolved,
    searchParams,
    location.search,
    location.pathname,
    token,
  ]);

  /**
   * Re-assert modal visibility whenever pending verification still exists.
   */
  useEffect(() => {
    if (!verifyIntentResolved || isEmailVerified) return;

    const pending = readPartnerUrlVerifyPending();
    if (!pending?.mappingId) return;
    if (isPartnerUrlOtpVerified(pending.mappingId)) {
      clearPartnerUrlVerifyContext();
      setIsEmailVerified(true);
      setShowVerifyModal(false);
      setVerifyContext(null);
      return;
    }

    if (!showVerifyModal || !verifyContext) {
      setVerifyContext(
        (prev) =>
          prev || {
            ...pending,
            partnerUrl:
              pending.partnerUrl || `${location.pathname}${location.search}`,
            token: pending.token || String(token ?? "").trim(),
          }
      );
      setShowVerifyModal(true);
      setIsEmailVerified(false);
    }
  }, [
    verifyIntentResolved,
    isEmailVerified,
    showVerifyModal,
    verifyContext,
    location.pathname,
    location.search,
    token,
  ]);

  // Strip IsTest after capture. Keep partnerVerify params while verification is pending.
  useEffect(() => {
    if (!isSearchReady || !verifyIntentResolved || urlSanitized) return;

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

    if (isEmailVerified || !showVerifyModal) {
      VERIFY_QUERY_KEYS.forEach((key) => {
        if (params.has(key)) {
          params.delete(key);
          changed = true;
        }
      });
    }

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
    verifyIntentResolved,
    urlSanitized,
    location.pathname,
    location.search,
    navigate,
    isEmailVerified,
    showVerifyModal,
  ]);

  const respondentUid = flowParams.uid;
  const hasValidUid = Boolean(respondentUid);
  const requiresEmailVerification =
    Boolean(verifyContext) && !isEmailVerified;
  const contentLocked =
    !verifyIntentResolved || requiresEmailVerification;
  const canLoadPartnerApis =
    isSearchReady &&
    urlSanitized &&
    verifyIntentResolved &&
    !requiresEmailVerification;

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
    const surveyUrl = replaceSurveyLinkPlaceholders(rawSurveyUrl, actionUid);
    window.location.assign(surveyUrl);
  }

  async function handleStartSurvey() {
    if (contentLocked || isStarting || isSubmittingPrescreen || isRedirecting) {
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
    if (contentLocked || isSubmittingPrescreen || isRedirecting || isStarting) {
      return;
    }

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

  const stripVerifyParamsFromUrl = () => {
    const params = new URLSearchParams(location.search);
    let changed = false;
    VERIFY_QUERY_KEYS.forEach((key) => {
      if (params.has(key)) {
        params.delete(key);
        changed = true;
      }
    });
    if (!changed) return;
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true }
    );
  };

  const handleVerifyClose = () => {
    clearSurveyAccessTempToken();
    clearPartnerUrlVerifyPending();
    clearPartnerUrlVerifyContext();
    setShowVerifyModal(false);
    setVerifyContext(null);
    stripVerifyParamsFromUrl();
    // Close this Partner URL tab only — user remains on Partner Mapping.
    window.setTimeout(() => {
      window.close();
    }, 0);
  };

  const handleVerified = () => {
    const mappingId = verifyContext?.mappingId;
    clearSurveyAccessTempToken();
    clearPartnerUrlVerifyPending();
    clearPartnerUrlVerifyContext();
    if (mappingId) {
      markPartnerUrlOtpVerified(mappingId);
    }
    setShowVerifyModal(false);
    setVerifyContext(null);
    setIsEmailVerified(true);
    stripVerifyParamsFromUrl();
  };

  const pageReady =
    !contentLocked && !isLoading && isSearchReady && urlSanitized;
  const showUidError =
    pageReady && !isLoading && isSearchReady && urlSanitized && !hasValidUid;
  const flowBusy = isStarting || isSubmittingPrescreen || isRedirecting;
  const modalOpen =
    showVerifyModal && requiresEmailVerification && verifyIntentResolved;

  return (
    <PublicQuestionnaireLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      {!contentLocked && (isLoading || !isSearchReady || !urlSanitized) ? (
        <div className="pq-card pq-state-card pq-loading-card" aria-busy="true" aria-live="polite">
          <Loader2 className="pq-loading-spinner" size={32} aria-hidden />
          <p className="pq-loading-text">Preparing your survey...</p>
        </div>
      ) : null}

      {!contentLocked && isRedirecting && !showPrescreen ? (
        <div className="pq-card pq-state-card pq-loading-card" aria-busy="true" aria-live="polite">
          <Loader2 className="pq-loading-spinner" size={32} aria-hidden />
          <p className="pq-loading-text">Opening your survey...</p>
        </div>
      ) : null}

      <div
        className={contentLocked ? "pointer-events-none select-none" : undefined}
        aria-hidden={contentLocked || undefined}
      >
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
              disabled={showUidError || contentLocked || flowBusy}
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
      </div>

      <PartnerUrlOtpVerificationModal
        isOpen={modalOpen}
        onClose={handleVerifyClose}
        partnerUrl={verifyContext?.partnerUrl || location.pathname}
        mappingId={verifyContext?.mappingId}
        onVerified={handleVerified}
      />
    </PublicQuestionnaireLayout>
  );
}

export default DoSurveyStartPage;
