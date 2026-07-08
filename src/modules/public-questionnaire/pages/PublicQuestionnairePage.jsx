import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import PublicQuestionnaireLayout from "../layout/PublicQuestionnaireLayout";
import QuestionRenderer from "../components/QuestionRenderer";
import { isAnswerProvided } from "../utils/answerValidation";
import { fetchPublicQuestionnaire } from "../data/sampleQuestionnaire";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";

function PublicQuestionnairePage({ isDarkMode, onToggleTheme }) {
  const { id } = useParams();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setCurrentIndex(0);
      setAnswers({});
      setShowValidation(false);
      setIsSubmitted(false);
      try {
        const data = await fetchPublicQuestionnaire(id);
        if (!cancelled) {
          setQuestionnaire(data);
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
  }, [id]);

  const questions = questionnaire?.questions ?? [];
  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLastStep = currentIndex === total - 1;
  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const canProceed = useMemo(
    () => (currentQuestion ? isAnswerProvided(currentQuestion, currentAnswer) : false),
    [currentQuestion, currentAnswer]
  );

  function handleAnswerChange(nextValue) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: nextValue }));
    setShowValidation(false);
  }

  function handlePrevious() {
    setShowValidation(false);
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function handleNext() {
    if (!canProceed) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setCurrentIndex((index) => Math.min(total - 1, index + 1));
  }

  function handleSubmit() {
    if (!canProceed) {
      setShowValidation(true);
      return;
    }
    // Static phase: no API. Capture answers in UI-only submitted state.
    setIsSubmitted(true);
  }

  return (
    <PublicQuestionnaireLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      {isLoading ? (
        <div
          className="rounded-2xl border px-6 py-16 text-center text-sm"
          style={{
            background: "var(--admin-surface-bg)",
            borderColor: "var(--admin-surface-border)",
            color: "var(--admin-muted-foreground)",
          }}
        >
          Loading questionnaire...
        </div>
      ) : null}

      {!isLoading && !questionnaire ? (
        <div
          className="rounded-2xl border px-6 py-12 text-center"
          style={{
            background: "var(--admin-surface-bg)",
            borderColor: "var(--admin-surface-border)",
            color: "var(--admin-foreground)",
          }}
        >
          <p className="text-lg font-semibold">Questionnaire not available</p>
          <p className="mt-2 text-sm" style={{ color: "var(--admin-muted-foreground)" }}>
            Please check the link and try again.
          </p>
        </div>
      ) : null}

      {!isLoading && questionnaire && isSubmitted ? (
        <div
          className="rounded-2xl border px-6 py-12 text-center sm:px-8"
          style={{
            background: "var(--admin-surface-bg)",
            borderColor: "var(--admin-surface-border)",
            color: "var(--admin-foreground)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              background:
                "color-mix(in srgb, var(--admin-primary-color) 16%, transparent)",
              color: "var(--admin-primary-color)",
            }}
          >
            <CheckCircle2 size={28} />
          </div>
          <h1 className="text-xl font-semibold sm:text-2xl">Thank you!</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed" style={{ color: "var(--admin-muted-foreground)" }}>
            Your responses have been recorded. You may close this page.
          </p>
        </div>
      ) : null}

      {!isLoading && questionnaire && !isSubmitted && currentQuestion ? (
        <div
          className="overflow-hidden rounded-2xl border shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
          style={{
            background: "var(--admin-surface-bg)",
            borderColor: "var(--admin-surface-border)",
            color: "var(--admin-foreground)",
          }}
        >
          <div
            className="border-b px-5 py-5 sm:px-7"
            style={{ borderColor: "var(--admin-surface-border)" }}
          >
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {questionnaire.surveyTitle}
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--admin-muted-foreground)" }}>
              Language: {questionnaire.language}
            </p>
          </div>

          <div className="px-5 pt-5 sm:px-7">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium" style={{ color: "var(--admin-muted-foreground)" }}>
                Question {currentIndex + 1} of {total}
              </span>
              <span className="tabular-nums text-xs font-semibold text-[var(--admin-primary-color)]">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div
              className="mb-6 h-1.5 overflow-hidden rounded-full"
              style={{ background: "var(--admin-input-border)" }}
              role="progressbar"
              aria-valuenow={currentIndex + 1}
              aria-valuemin={1}
              aria-valuemax={total}
              aria-label={`Question ${currentIndex + 1} of ${total}`}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                  background: "var(--admin-primary-color)",
                }}
              />
            </div>

            <div className="mb-2 flex items-start gap-2">
              <p className="text-base font-semibold leading-snug sm:text-lg">
                {currentQuestion.questionText}
              </p>
              {currentQuestion.required ? (
                <span className="shrink-0 text-sm text-[var(--admin-primary-color)]" aria-hidden>
                  *
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              <QuestionRenderer
                question={currentQuestion}
                value={currentAnswer}
                onChange={handleAnswerChange}
              />
            </div>

            {showValidation && !canProceed ? (
              <p className="mt-3 text-sm text-red-500" role="alert">
                Please answer this question to continue.
              </p>
            ) : null}
          </div>

          <div
            className="mt-6 flex flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"
            style={{ borderColor: "var(--admin-surface-border)" }}
          >
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`${getAdminCancelButtonClass()} w-full sm:w-auto`}
            >
              Previous
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="admin-btn-primary h-11 w-full px-6 sm:w-auto"
              >
                Submit
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="admin-btn-primary h-11 w-full px-6 sm:w-auto"
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
