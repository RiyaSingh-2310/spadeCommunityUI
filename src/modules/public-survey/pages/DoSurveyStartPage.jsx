import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PublicQuestionnaireLayout from "../../public-questionnaire/layout/PublicQuestionnaireLayout";
import SurveyEmptyState from "../../public-questionnaire/components/SurveyEmptyState";
import PartnerUrlOtpVerificationModal from "../../survey/components/PartnerUrlOtpVerificationModal";
import {
  PARTNER_MAPPING_ID_QUERY_KEY,
  PARTNER_VERIFY_QUERY_KEY,
  clearPartnerUrlVerifyContext,
  clearPartnerUrlVerifyPending,
  isPartnerUrlOtpVerified,
  readPartnerUrlVerifyPending,
  readPartnerVerifyIntentFromSearch,
  stashPartnerUrlVerifyPending,
} from "../../survey/utils/partnerUrlVerifyContext";
import {
  claimPartnerUrlTabAsAdminOpened,
  subscribePartnerUrlTabAdminLogout,
} from "../../survey/utils/partnerUrlTabSync";
import DoSurveyHero from "../components/DoSurveyHero";
import { fetchDoSurveyStartDetails, startDoSurvey } from "../services/doSurveyApi";
import {
  classifyDoSurveyError,
  resolveRespondentUid,
} from "../utils/doSurveyHelpers";
import { clearSurveyAccessTempToken } from "../../survey/services/partnerUrlOtpApi";

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
  const [hasStarted, setHasStarted] = useState(false);
  const [startMessage, setStartMessage] = useState("");
  const [startError, setStartError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const [verifyContext, setVerifyContext] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyIntentResolved, setVerifyIntentResolved] = useState(false);

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
    // searchKey covers searchParams / location.search changes without object identity churn.
  }, [token, searchKey, searchParams, location.search]);

  /**
   * Resolve partner email-verification intent from:
   * 1) URL params (partnerVerify=1&mappingId=...) set when Partner Mapping opens a tab
   * 2) sessionStorage pending stash (survives refresh / remount after sanitize)
   *
   * Modal stays open until OTP success or Close (✕) — not on refresh/re-render/nav.
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
   * Covers remounts, refresh, and in-app navigations that return to this page.
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
      setVerifyContext((prev) => prev || {
        ...pending,
        partnerUrl:
          pending.partnerUrl || `${location.pathname}${location.search}`,
        token: pending.token || String(token ?? "").trim(),
      });
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

  // Strip IsTest from the address bar after capture.
  // Keep partnerVerify params while verification is pending so refresh reopens the modal;
  // they are removed on verify success or Close.
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

    // Only strip verify params once the user has completed or dismissed verification.
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

  const respondentUid = useMemo(
    () => resolveRespondentUid(searchParams, location.search),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchKey, location.search]
  );

  const hasValidUid = respondentUid != null;
  const requiresEmailVerification =
    Boolean(verifyContext) && !isEmailVerified;
  const contentLocked =
    !verifyIntentResolved || requiresEmailVerification;
  const showUidError =
    !contentLocked && !isLoading && isSearchReady && urlSanitized && !hasValidUid;
  const canLoadPartnerApis =
    isSearchReady &&
    urlSanitized &&
    verifyIntentResolved &&
    !requiresEmailVerification;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const normalizedToken = String(token ?? "").trim();
      if (!normalizedToken) {
        setSurvey(null);
        setLoadError("Missing survey token. Please use a valid partner survey link.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError("");
      setHasStarted(false);
      setStartMessage("");
      setStartError("");
      setIsStarting(false);

      try {
        const data = await fetchDoSurveyStartDetails(normalizedToken, {
          uid: respondentUid,
          isTest: isTestHint,
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

    // Partner / survey APIs must wait until email verification succeeds.
    if (!canLoadPartnerApis) {
      if (requiresEmailVerification) {
        setIsLoading(false);
        setSurvey(null);
        setLoadError("");
      }
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
    requiresEmailVerification,
    respondentUid,
    isTestHint,
  ]);

  const errorVariant = classifyDoSurveyError(loadError);

  async function handleStartSurvey() {
    if (contentLocked) return;

    const actionUid =
      resolveRespondentUid(searchParams, location.search) ??
      (typeof window !== "undefined"
        ? resolveRespondentUid(null, window.location.search)
        : null);

    if (actionUid == null) {
      setStartError("Missing or Invalid UID in Link");
      return;
    }

    setStartError("");
    setIsStarting(true);

    try {
      const result = await startDoSurvey(token, { uid: actionUid });
      setStartMessage(
        String(result?.message ?? "").trim() || "Survey session started successfully."
      );
      setHasStarted(true);
    } catch (error) {
      setStartError(
        String(error?.message ?? "").trim() ||
          "Unable to start the survey right now. Please try again."
      );
    } finally {
      setIsStarting(false);
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
    // Close this Partner URL tab only — no redirect/navigation.
    window.setTimeout(() => {
      window.close();
    }, 0);
  };

  /**
   * After OTP success the backend returns vendorUrl — redirect this tab there.
   * Do not load Partner/survey APIs on the gateway page.
   */
  const handleVerified = (result) => {
    const vendorUrl = String(result?.vendorUrl ?? "").trim();
    clearSurveyAccessTempToken();
    clearPartnerUrlVerifyPending();
    clearPartnerUrlVerifyContext();
    setShowVerifyModal(false);

    if (!vendorUrl) {
      setIsEmailVerified(false);
      return;
    }

    // Final survey destination — leave the Partner URL gateway immediately.
    window.location.assign(vendorUrl);
  };

  const pageReady =
    !contentLocked && !isLoading && isSearchReady && urlSanitized;
  // Open modal as soon as verify intent is known — do not wait on survey API.
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

        {pageReady && survey && !hasStarted ? (
          <>
            <DoSurveyHero
              survey={survey}
              onStart={handleStartSurvey}
              disabled={showUidError || contentLocked}
              isStarting={isStarting}
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

        {pageReady && survey && hasStarted ? (
          <div className="pq-card pq-state-card pq-empty-state">
            <h1 className="pq-empty-title">Survey starting soon</h1>
            <p className="pq-empty-description">
              {startMessage ||
                "Your session has been recorded. The full survey experience will load here once the backend API is connected."}
            </p>
            <p className="admin-text-subtle mt-4 text-sm">
              Token: <span className="font-mono">{survey.meta?.previewLabel || token}</span>
              {respondentUid ? (
                <>
                  {" "}
                  · Respondent: <span className="font-mono">{respondentUid}</span>
                </>
              ) : null}
            </p>
          </div>
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
