import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PublicQuestionnaireLayout from "../layout/PublicQuestionnaireLayout";
import QuestionRenderer from "../components/QuestionRenderer";
import SurveyHero from "../components/SurveyHero";
import SurveyProgress from "../components/SurveyProgress";
import SurveyCompletion from "../components/SurveyCompletion";
import SurveyEmptyState from "../components/SurveyEmptyState";
import { isAnswerProvided } from "../utils/answerValidation";
import { classifySurveyError } from "../utils/surveyHelpers";
import {
  fetchPublicQuestionnaire,
  submitPublicQuestionnaire,
} from "../../../services/questionnaire-group/publicQuestionnaireApi";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";

const PANELIST_QUERY_KEYS = ["panelist_id", "panelistId", "PanelistId", "panelist"];

function normalizePanelistId(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readPanelistIdFromSearch(search) {
  if (search == null) return null;
  const query = String(search).startsWith("?") ? String(search).slice(1) : String(search);
  if (!query) return null;

  try {
    const params = new URLSearchParams(query);
    for (const key of PANELIST_QUERY_KEYS) {
      const normalized = normalizePanelistId(params.get(key));
      if (normalized != null) return normalized;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Resolve panelist_id from the live URL.
 * Prefer React Router search params, then fall back to window.location so
 * query params are not lost after SPA rewrites / lazy route mounts (e.g. Vercel).
 */
function resolvePanelistId(searchParams, locationSearch) {
  const fromRouter =
    readPanelistIdFromSearch(searchParams?.toString?.() ?? "") ??
    readPanelistIdFromSearch(locationSearch);

  if (fromRouter != null) return fromRouter;

  if (typeof window !== "undefined") {
    return readPanelistIdFromSearch(window.location.search);
  }

  return null;
}

function PublicQuestionnairePage({ isDarkMode, onToggleTheme }) {
  const { id: questionnaireGroupId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const panelistId = useMemo(
    () => resolvePanelistId(searchParams, location.search),
    // searchKey tracks query changes without depending on URLSearchParams identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchKey, location.search]
  );
  const [isSearchReady, setIsSearchReady] = useState(false);

  const [questionnaire, setQuestionnaire] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState("forward");
  const [answers, setAnswers] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submissionId, setSubmissionId] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mark search params ready only after mount + location is available.
  // Prevents false "missing panelist_id" flashes before the router settles.
  useEffect(() => {
    setIsSearchReady(true);
  }, [location.search, searchParams]);

  const resolvedPanelistId = useMemo(() => {
    if (!isSearchReady) return null;
    return panelistId;
  }, [isSearchReady, panelistId]);

  const hasValidPanelistId = resolvedPanelistId != null;
  const showPanelistError = !isLoading && isSearchReady && !hasValidPanelistId;

  function getPanelistIdForAction() {
    // Re-read at action time so submit/start never rely on a stale render.
    return (
      resolvePanelistId(searchParams, location.search) ??
      (typeof window !== "undefined" ? readPanelistIdFromSearch(window.location.search) : null)
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!questionnaireGroupId) {
        setQuestionnaire(null);
        setLoadError("Missing questionnaire group id. Please use a valid questionnaire link.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError("");
      setHasStarted(false);
      setCurrentIndex(0);
      setTransitionDirection("forward");
      setAnswers({});
      setShowValidation(false);
      setIsSubmitted(false);
      setSuccessMessage("");
      setSubmissionId(null);
      setSubmitError("");
      setIsSubmitting(false);

      try {
        const data = await fetchPublicQuestionnaire(questionnaireGroupId);
        if (!cancelled) {
          setQuestionnaire(data);
        }
      } catch (error) {
        if (!cancelled) {
          setQuestionnaire(null);
          setLoadError(
            String(error?.message ?? "").trim() || "Unable to load questionnaire. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [questionnaireGroupId]);

  const questions = questionnaire?.questions ?? [];
  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLastStep = total > 0 && currentIndex === total - 1;
  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const canProceed = useMemo(
    () => (currentQuestion ? isAnswerProvided(currentQuestion, currentAnswer) : false),
    [currentQuestion, currentAnswer]
  );

  const errorVariant = classifySurveyError(loadError);

  function handleStartSurvey() {
    const actionPanelistId = getPanelistIdForAction();
    if (actionPanelistId == null) {
      setSubmitError(
        "Missing or invalid panelist_id in the link. Please use a valid questionnaire URL."
      );
      return;
    }
    setSubmitError("");
    setHasStarted(true);
  }

  function handleAnswerChange(nextValue) {
    if (!currentQuestion || isSubmitting || isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: nextValue }));
    setShowValidation(false);
    setSubmitError("");
  }

  function handlePrevious() {
    if (isSubmitting || isSubmitted) return;
    setTransitionDirection("back");
    setShowValidation(false);
    setSubmitError("");
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function handleNext() {
    if (isSubmitting || isSubmitted) return;
    if (!canProceed) {
      setShowValidation(true);
      return;
    }
    setTransitionDirection("forward");
    setShowValidation(false);
    setSubmitError("");
    setCurrentIndex((index) => Math.min(total - 1, index + 1));
  }

  async function handleSubmit() {
    if (isSubmitting || isSubmitted) return;
    if (!canProceed) {
      setShowValidation(true);
      return;
    }

    const actionPanelistId = getPanelistIdForAction();
    if (actionPanelistId == null) {
      setSubmitError(
        "Missing or invalid panelist_id in the link. Please use a valid questionnaire URL."
      );
      return;
    }

    setShowValidation(false);
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const result = await submitPublicQuestionnaire(questionnaireGroupId, {
        panelistId: actionPanelistId,
        questions,
        answers,
      });
      setSuccessMessage(
        String(result?.message ?? "").trim() || "Answers submitted successfully!"
      );
      setSubmissionId(result?.data?.submission_id ?? null);
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(
        String(error?.message ?? "").trim() || "Unable to submit answers. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PublicQuestionnaireLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      {isLoading || !isSearchReady ? (
        <div className="pq-card pq-state-card pq-loading-card" aria-busy="true" aria-live="polite">
          <Loader2 className="pq-loading-spinner" size={32} aria-hidden />
          <p className="pq-loading-text">Preparing your survey...</p>
        </div>
      ) : null}

      {!isLoading && isSearchReady && !questionnaire ? (
        <SurveyEmptyState
          variant={errorVariant}
          description={loadError || undefined}
        />
      ) : null}

      {!isLoading && isSearchReady && questionnaire && isSubmitted ? (
        <SurveyCompletion message={successMessage} submissionId={submissionId} />
      ) : null}

      {!isLoading && isSearchReady && questionnaire && !isSubmitted && total === 0 ? (
        <SurveyEmptyState
          variant="empty"
          title={questionnaire.surveyTitle}
          description="This questionnaire does not have any questions yet."
        />
      ) : null}

      {!isLoading && isSearchReady && questionnaire && !isSubmitted && total > 0 && !hasStarted ? (
        <>
          <SurveyHero
            questionnaire={questionnaire}
            questionCount={total}
            onStart={handleStartSurvey}
            disabled={showPanelistError}
          />
          {showPanelistError ? (
            <p className="pq-hero-error" role="alert">
              Missing or invalid panelist_id in the link. Please use a valid questionnaire URL.
            </p>
          ) : null}
          {submitError ? (
            <p className="pq-hero-error" role="alert">
              {submitError}
            </p>
          ) : null}
        </>
      ) : null}

      {!isLoading &&
      isSearchReady &&
      questionnaire &&
      !isSubmitted &&
      hasStarted &&
      currentQuestion ? (
        <div className="pq-survey-card pq-card">
          <div className="pq-survey-card-body">
            <div className="pq-survey-intro">
              <h1 className="pq-survey-card-title">{questionnaire.surveyTitle}</h1>
              {questionnaire.language ? (
                <span className="pq-language-badge">{questionnaire.language}</span>
              ) : null}
            </div>

            <SurveyProgress
              currentIndex={currentIndex}
              total={total}
              progressPercent={progressPercent}
            />

            <div
              key={currentIndex}
              className={`pq-question-panel pq-question-panel--${transitionDirection}`}
            >
              <span className="pq-question-label">Question {currentIndex + 1}</span>

              <div className="pq-question-header">
                <h2 className="pq-question-title" id={`question-${currentQuestion.id}`}>
                  {currentQuestion.questionText}
                </h2>
                {currentQuestion.required ? (
                  <span className="pq-required-mark" aria-label="Required">
                    *
                  </span>
                ) : null}
              </div>

              <div className="pq-answer-area" aria-labelledby={`question-${currentQuestion.id}`}>
                <QuestionRenderer
                  question={currentQuestion}
                  value={currentAnswer}
                  onChange={handleAnswerChange}
                />
              </div>
            </div>

            {showValidation && !canProceed ? (
              <p className="pq-inline-error" role="alert">
                Please answer this question to continue.
              </p>
            ) : null}

            {submitError ? (
              <p className="pq-inline-error" role="alert">
                {submitError}
              </p>
            ) : null}
          </div>

          <div className="pq-survey-card-footer">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isSubmitting}
              className={`pq-nav-btn pq-nav-btn--secondary ${getAdminCancelButtonClass()}`}
            >
              Previous
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !hasValidPanelistId || !canProceed}
                className="pq-nav-btn pq-nav-btn--primary admin-btn-primary"
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="pq-btn-spinner" size={18} aria-hidden />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting || !canProceed}
                className="pq-nav-btn pq-nav-btn--primary admin-btn-primary"
              >
                Next
              </button>
            )}
          </div>
        </div>
      ) : null}
    </PublicQuestionnaireLayout>
  );
}

export default PublicQuestionnairePage;
