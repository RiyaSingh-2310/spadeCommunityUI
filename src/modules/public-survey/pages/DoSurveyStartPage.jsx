import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PublicQuestionnaireLayout from "../../public-questionnaire/layout/PublicQuestionnaireLayout";
import SurveyEmptyState from "../../public-questionnaire/components/SurveyEmptyState";
import DoSurveyHero from "../components/DoSurveyHero";
import { fetchDoSurveyStartDetails, startDoSurvey } from "../services/doSurveyApi";
import {
  classifyDoSurveyError,
  resolveRespondentUid,
} from "../utils/doSurveyHelpers";

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

  useEffect(() => {
    setIsSearchReady(true);
  }, [location.search, searchParams]);

  // Read IsTest once, then remove it from the address bar.
  useEffect(() => {
    if (!isSearchReady || urlSanitized) return;

    const params = new URLSearchParams(location.search);
    const captured = readIsTestFromSearch(location.search);
    if (captured !== undefined) {
      setIsTestHint(captured);
    }

    const hadIsTest = IS_TEST_QUERY_KEYS.some((key) => params.has(key));
    if (hadIsTest) {
      IS_TEST_QUERY_KEYS.forEach((key) => params.delete(key));
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
  }, [isSearchReady, urlSanitized, location.pathname, location.search, navigate]);

  const respondentUid = useMemo(
    () => resolveRespondentUid(searchParams, location.search),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchKey, location.search]
  );

  const hasValidUid = respondentUid != null;
  const showUidError = !isLoading && isSearchReady && !hasValidUid;

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

    if (isSearchReady && urlSanitized) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [token, isSearchReady, urlSanitized, respondentUid, isTestHint]);

  const errorVariant = classifyDoSurveyError(loadError);

  async function handleStartSurvey() {
    const actionUid =
      resolveRespondentUid(searchParams, location.search) ??
      (typeof window !== "undefined"
        ? resolveRespondentUid(null, window.location.search)
        : null);

    if (actionUid == null) {
      setStartError(
        "Missing or invalid uid in the link. Partners should replace [identifier] with a respondent id."
      );
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

  return (
    <PublicQuestionnaireLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      {isLoading || !isSearchReady || !urlSanitized ? (
        <div className="pq-card pq-state-card pq-loading-card" aria-busy="true" aria-live="polite">
          <Loader2 className="pq-loading-spinner" size={32} aria-hidden />
          <p className="pq-loading-text">Preparing your survey...</p>
        </div>
      ) : null}

      {!isLoading && isSearchReady && urlSanitized && !survey ? (
        <SurveyEmptyState
          variant={errorVariant}
          description={loadError || undefined}
        />
      ) : null}

      {!isLoading && isSearchReady && urlSanitized && survey && !hasStarted ? (
        <>
          <DoSurveyHero
            survey={survey}
            onStart={handleStartSurvey}
            disabled={showUidError}
            isStarting={isStarting}
          />
          {showUidError ? (
            <p className="pq-hero-error" role="alert">
              Missing or invalid uid in the link. Use a URL like{" "}
              <code className="text-xs">/dosurvey/{token}?uid=your-respondent-id</code>
            </p>
          ) : null}
          {startError ? (
            <p className="pq-hero-error" role="alert">
              {startError}
            </p>
          ) : null}
        </>
      ) : null}

      {!isLoading && isSearchReady && urlSanitized && survey && hasStarted ? (
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
    </PublicQuestionnaireLayout>
  );
}

export default DoSurveyStartPage;
