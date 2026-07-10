import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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

function resolvePanelistId(searchParams) {
  const raw = searchParams.get("panelist_id");
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function PublicQuestionnairePage({ isDarkMode, onToggleTheme }) {
  const { id: questionnaireGroupId } = useParams();
  const [searchParams] = useSearchParams();
  const panelistId = resolvePanelistId(searchParams);

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
    if (panelistId == null) {
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

    if (panelistId == null) {
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
        panelistId,
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
      {isLoading ? (
        <div className="pq-card pq-state-card pq-loading-card" aria-busy="true" aria-live="polite">
          <Loader2 className="pq-loading-spinner" size={32} aria-hidden />
          <p className="pq-loading-text">Preparing your survey...</p>
        </div>
      ) : null}

      {!isLoading && !questionnaire ? (
        <SurveyEmptyState
          variant={errorVariant}
          description={loadError || undefined}
        />
      ) : null}

      {!isLoading && questionnaire && isSubmitted ? (
        <SurveyCompletion message={successMessage} submissionId={submissionId} />
      ) : null}

      {!isLoading && questionnaire && !isSubmitted && total === 0 ? (
        <SurveyEmptyState
          variant="empty"
          title={questionnaire.surveyTitle}
          description="This questionnaire does not have any questions yet."
        />
      ) : null}

      {!isLoading && questionnaire && !isSubmitted && total > 0 && !hasStarted ? (
        <>
          <SurveyHero
            questionnaire={questionnaire}
            questionCount={total}
            onStart={handleStartSurvey}
            disabled={panelistId == null}
          />
          {panelistId == null ? (
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

      {!isLoading && questionnaire && !isSubmitted && hasStarted && currentQuestion ? (
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
                disabled={isSubmitting || panelistId == null}
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
                disabled={isSubmitting}
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
