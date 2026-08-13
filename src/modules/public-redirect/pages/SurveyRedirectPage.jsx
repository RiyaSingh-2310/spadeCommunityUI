import { useCallback, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import RedirectLayout from "../components/RedirectLayout";
import RedirectCard from "../components/RedirectCard";
import RedirectMessage from "../components/RedirectMessage";
import LoadingState from "../components/LoadingState";
import FallbackState from "../components/FallbackState";
import QueryParameterHandler from "../components/QueryParameterHandler";
import { getRedirectOutcomeConfig } from "../constants/redirectOutcomes";
import {
  getSurveyOutcomePath,
  normalizeFlowUid,
  normalizeSurveyOutcomeKey,
} from "../../public-survey/utils/surveyFlowParams";

const VIEW = {
  LOADING: "loading",
  SUCCESS: "success",
  FALLBACK: "fallback",
};

const UID_QUERY_KEYS = [
  "uid",
  "identifier",
  "respondent_id",
  "respondentId",
  "participant_id",
  "participantId",
];

function readRealUidFromParams(params) {
  if (!params || typeof params !== "object") return "";
  for (const key of UID_QUERY_KEYS) {
    const value = normalizeFlowUid(params[key]);
    if (value) return value;
  }
  return "";
}

/**
 * Inner flow for a single redirect outcome.
 * Remounted when the outcome path changes so view state stays in sync.
 *
 * Frontend-only: reads query params into state for future backend use.
 * Does not call APIs or apply survey update logic.
 */
function SurveyRedirectContent({ outcome, outcomeConfig }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState(VIEW.LOADING);
  const [fallback, setFallback] = useState(null);
  /**
   * All URL query params (dynamic keys).
   * Stored for future backend integration only — no business logic applied yet.
   */
  const [queryParams, setQueryParams] = useState({});
  const [retryKey, setRetryKey] = useState(0);

  const handleParamsError = useCallback(() => {
    setQueryParams({});
    setFallback({
      title: "Redirect link unavailable",
      description:
        "We could not read the details on this link. Please check the URL or contact support if you need help.",
    });
    setView(VIEW.FALLBACK);
  }, []);

  const handleParamsProcessed = useCallback(
    ({ params }) => {
      setQueryParams(params ?? {});

      if (!outcomeConfig) {
        setFallback({
          title: "Redirect link unavailable",
          description:
            "This redirect link is not recognized. Please use a valid survey redirect URL or contact support.",
        });
        setView(VIEW.FALLBACK);
        return;
      }

      // Prefer independent result routes with a real UID; never keep
      // placeholder uid=[identifier] / XXX in the address bar.
      const outcomeKey = normalizeSurveyOutcomeKey(outcome);
      const realUid = readRealUidFromParams(params);
      const preferredPath = getSurveyOutcomePath(outcomeKey || outcome, realUid);
      const isIndependentResultPath =
        preferredPath &&
        /^\/(complete|terminate|quota-full)\//.test(preferredPath);

      if (isIndependentResultPath && preferredPath !== location.pathname) {
        navigate(preferredPath, { replace: true });
        return;
      }

      if (location.search) {
        // Strip placeholder / vendor query noise for /redirect/* pages.
        navigate(
          { pathname: location.pathname, search: "" },
          { replace: true }
        );
        return;
      }

      setFallback(null);
      setView(VIEW.SUCCESS);
    },
    [outcomeConfig, outcome, navigate, location.pathname, location.search]
  );

  const handleRetry = useCallback(() => {
    setView(VIEW.LOADING);
    setFallback(null);
    setQueryParams({});
    setRetryKey((key) => key + 1);
  }, []);

  const preparedParamCount = Object.keys(queryParams).length;
  const variant = outcomeConfig?.variant || "neutral";

  return (
    <>
      <QueryParameterHandler
        key={retryKey}
        onProcessed={handleParamsProcessed}
        onError={handleParamsError}
      />

      {view === VIEW.LOADING ? <LoadingState /> : null}

      {view === VIEW.SUCCESS && outcomeConfig ? (
        <RedirectCard
          variant={variant}
          data-redirect-outcome={outcome}
          data-redirect-param-count={preparedParamCount}
        >
          <RedirectMessage
            title={outcomeConfig.title}
            message={outcomeConfig.message}
            icon={outcomeConfig.icon}
            variant={variant}
            thankYouLines={outcomeConfig.thankYouLines}
          />
        </RedirectCard>
      ) : null}

      {view === VIEW.FALLBACK ? (
        <FallbackState
          title={fallback?.title}
          description={fallback?.description}
          onRetry={handleRetry}
        />
      ) : null}
    </>
  );
}

/**
 * Public survey redirect outcome page.
 * Routes: /redirect/:outcome
 *   complete | terminate | quota-full (legacy: overquota) | qualityterm | surveyclose
 */
function SurveyRedirectPage({ isDarkMode, onToggleTheme }) {
  const { outcome: outcomeParam } = useParams();
  const outcome = String(outcomeParam ?? "")
    .trim()
    .toLowerCase();
  const outcomeConfig = getRedirectOutcomeConfig(outcome);

  return (
    <RedirectLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      <SurveyRedirectContent
        key={outcome}
        outcome={outcome}
        outcomeConfig={outcomeConfig}
      />
    </RedirectLayout>
  );
}

export default SurveyRedirectPage;
