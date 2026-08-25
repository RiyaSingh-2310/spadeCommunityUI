import { useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import QuestionRenderer from "../../public-questionnaire/components/QuestionRenderer";
import SurveyProgress from "../../public-questionnaire/components/SurveyProgress";
import { isAnswerProvided } from "../../public-questionnaire/utils/answerValidation";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";

/**
 * Dynamic Pre-Screen questionnaire for the Partner URL Start Survey flow.
 * Questions and types come entirely from GET /api/survey/prescreen.
 */
function PreScreenQuestionnaire({
  prescreen,
  onSaveAnswer,
  onComplete,
  onSubmit,
  isSubmitting = false,
  submitError = "",
}) {
  const questions = prescreen?.questions ?? [];
  const total = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState("forward");
  const [answers, setAnswers] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const submitLockRef = useRef(false);
  const [isBusy, setIsBusy] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastStep = total > 0 && currentIndex === total - 1;
  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const canProceed = useMemo(
    () => (currentQuestion ? isAnswerProvided(currentQuestion, currentAnswer) : false),
    [currentQuestion, currentAnswer]
  );

  const surveyTitle = String(prescreen?.surveyTitle ?? "").trim() || "Pre-Screen";
  const language = String(prescreen?.language ?? "").trim();
  const controlsLocked = isSubmitting || isBusy;

  async function persistCurrentAnswer() {
    if (!currentQuestion) return;
    if (typeof onSaveAnswer === "function") {
      await onSaveAnswer(currentQuestion, currentAnswer);
    }
  }

  function handleAnswerChange(nextValue) {
    if (!currentQuestion || controlsLocked) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: nextValue }));
    setShowValidation(false);
  }

  function handlePrevious() {
    if (controlsLocked || submitLockRef.current) return;
    setTransitionDirection("back");
    setShowValidation(false);
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  async function handleNext() {
    if (controlsLocked || submitLockRef.current) return;
    if (!canProceed) {
      setShowValidation(true);
      return;
    }

    submitLockRef.current = true;
    setIsBusy(true);
    try {
      await persistCurrentAnswer();
      setTransitionDirection("forward");
      setShowValidation(false);
      setCurrentIndex((index) => Math.min(total - 1, index + 1));
    } catch {
      // Parent surfaces the API error; stay on this question.
    } finally {
      submitLockRef.current = false;
      setIsBusy(false);
    }
  }

  async function handleSubmit() {
    if (controlsLocked || submitLockRef.current) return;
    if (total > 0 && !canProceed) {
      setShowValidation(true);
      return;
    }

    submitLockRef.current = true;
    setIsBusy(true);
    try {
      if (total > 0) {
        await persistCurrentAnswer();
      }
      if (typeof onComplete === "function") {
        await onComplete({ questions, answers });
      } else {
        await onSubmit?.({ questions, answers });
      }
    } catch {
      // Parent surfaces the API error; do not advance.
      submitLockRef.current = false;
      setIsBusy(false);
    }
  }

  if (total === 0) {
    return (
      <div className="pq-card pq-state-card pq-empty-state">
        <h1 className="pq-empty-title">{surveyTitle}</h1>
        <p className="pq-empty-description">
          This pre-screen does not have any questions yet.
        </p>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSubmitting || isBusy}
          className="pq-nav-btn pq-nav-btn--primary admin-btn-primary mt-4"
          aria-busy={isSubmitting || isBusy}
        >
          {isSubmitting || isBusy ? (
            <>
              <Loader2 className="pq-btn-spinner" size={18} aria-hidden />
              Continuing...
            </>
          ) : (
            "Continue to Survey"
          )}
        </button>
        {submitError ? (
          <p className="pq-inline-error mt-3" role="alert">
            {submitError}
          </p>
        ) : null}
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="pq-survey-card pq-card">
      <div className="pq-survey-card-body">
        <div className="pq-survey-intro">
          <h1 className="pq-survey-card-title">{surveyTitle}</h1>
          {language ? (
            <span className="pq-language-badge">{language}</span>
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
            <h2 className="pq-question-title" id={`prescreen-question-${currentQuestion.id}`}>
              {currentQuestion.questionText}
            </h2>
            {currentQuestion.required ? (
              <span className="pq-required-mark" aria-label="Required">
                *
              </span>
            ) : null}
          </div>

          <div
            className="pq-answer-area"
            aria-labelledby={`prescreen-question-${currentQuestion.id}`}
          >
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
          disabled={currentIndex === 0 || controlsLocked}
          className={`pq-nav-btn pq-nav-btn--secondary ${getAdminCancelButtonClass()}`}
        >
          Previous
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={controlsLocked || !canProceed}
            className="pq-nav-btn pq-nav-btn--primary admin-btn-primary"
            aria-busy={controlsLocked}
          >
            {controlsLocked ? (
              <>
                <Loader2 className="pq-btn-spinner" size={18} aria-hidden />
                Continuing...
              </>
            ) : (
              "Submit"
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={controlsLocked || !canProceed}
            className="pq-nav-btn pq-nav-btn--primary admin-btn-primary"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default PreScreenQuestionnaire;
