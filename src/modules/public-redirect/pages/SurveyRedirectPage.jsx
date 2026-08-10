import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import RedirectLayout from "../components/RedirectLayout";
import RedirectCard from "../components/RedirectCard";
import RedirectMessage from "../components/RedirectMessage";
import LoadingState from "../components/LoadingState";
import FallbackState from "../components/FallbackState";
import QueryParameterHandler from "../components/QueryParameterHandler";
import { getRedirectOutcomeConfig } from "../constants/redirectOutcomes";

const VIEW = {
  LOADING: "loading",
  SUCCESS: "success",
  FALLBACK: "fallback",
};

/**
 * Inner flow for a single redirect outcome.
 * Remounted when the outcome path changes so view state stays in sync.
 *
 * Frontend-only: reads query params into state for future backend use.
 * Does not call APIs or apply survey update logic.
 */
function SurveyRedirectContent({ outcome, outcomeConfig }) {
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
      // Persist every query key/value for a future API payload.
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

      /**
       * FUTURE BACKEND INTEGRATION (not implemented):
       * Plug in an API here using `outcome` + stored query params to update final IP,
       * end date, survey/completion status, termination reason, and redirect metadata.
       * Keep this UI/routing shell unchanged when wiring the backend later.
       */

      setFallback(null);
      setView(VIEW.SUCCESS);
    },
    [outcomeConfig]
  );

  const handleRetry = useCallback(() => {
    setView(VIEW.LOADING);
    setFallback(null);
    setQueryParams({});
    setRetryKey((key) => key + 1);
  }, []);

  const preparedParamCount = Object.keys(queryParams).length;

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
          variant={outcomeConfig.variant === "success" ? "success" : "neutral"}
          data-redirect-outcome={outcome}
          data-redirect-param-count={preparedParamCount}
        >
          <RedirectMessage
            title={outcomeConfig.title}
            message={outcomeConfig.message}
            icon={outcomeConfig.icon}
            variant={outcomeConfig.variant === "success" ? "success" : "neutral"}
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
