import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import SearchableSelect from "../../../../components/admin/SearchableSelect";
import SearchableMultiSelect from "../../../../components/admin/SearchableMultiSelect";
import { getAdminInputClass } from "../../../shared/utils/formStyles";
import {
  getFindUserAnswerOptions,
  getFindUserQuestionsByLanguage,
  normalizeFindUserQuestionOptions,
} from "../services/findUserApi";
import { toastApiError } from "../../../../services/toast/apiToast";

/**
 * @typedef {{ id: string, questionId: string, answers: string[] }} FilterRow
 */

/**
 * @param {unknown} options
 * @returns {{ value: string, label: string }[]}
 */
function mapOptionsToSelectOptions(options) {
  return normalizeFindUserQuestionOptions(options).map((option) => ({
    value: option,
    label: option,
  }));
}

function FindUserFilters({
  filters,
  onFiltersChange,
  onAddFilter,
  onRemoveFilter,
  onSearch,
  isSearching,
  disabled = false,
  language = "",
}) {
  const inputClass = getAdminInputClass();
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [answerOptionsByQuestionId, setAnswerOptionsByQuestionId] = useState(
    () => new Map()
  );
  const [loadingAnswersFor, setLoadingAnswersFor] = useState("");

  useEffect(() => {
    let cancelled = false;
    const languageKey = String(language ?? "").trim();

    async function loadQuestions() {
      if (!languageKey) {
        setQuestions([]);
        setAnswerOptionsByQuestionId(new Map());
        setIsLoadingQuestions(false);
        return;
      }

      setIsLoadingQuestions(true);
      try {
        const nextQuestions = await getFindUserQuestionsByLanguage(languageKey);
        if (cancelled) return;
        setQuestions(nextQuestions);
        setAnswerOptionsByQuestionId(() => {
          const next = new Map();
          nextQuestions.forEach((question) => {
            const options = normalizeFindUserQuestionOptions(question.options);
            if (options.length > 0) {
              next.set(String(question.id), options);
            }
          });
          return next;
        });
      } catch (err) {
        if (cancelled) return;
        setQuestions([]);
        setAnswerOptionsByQuestionId(new Map());
        toastApiError(err);
      } finally {
        if (!cancelled) setIsLoadingQuestions(false);
      }
    }

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const questionsById = useMemo(() => {
    const map = new Map();
    questions.forEach((question) => {
      map.set(String(question.id), question);
    });
    return map;
  }, [questions]);

  const questionSelectOptions = useMemo(
    () =>
      questions.map((question) => ({
        value: question.id,
        label: question.question_title,
      })),
    [questions]
  );

  const updateRow = (id, patch) => {
    onFiltersChange(
      filters.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const handleRemoveFilter = (rowId) => {
    if (filters.length <= 1) return;
    onRemoveFilter?.(rowId);
  };

  const handleQuestionChange = async (rowId, questionId) => {
    updateRow(rowId, { questionId, answers: [] });

    const normalizedId = String(questionId ?? "").trim();
    if (!normalizedId) return;
    if (answerOptionsByQuestionId.has(normalizedId)) return;

    const selectedQuestion = questionsById.get(normalizedId);
    setLoadingAnswersFor(normalizedId);
    try {
      const options = await getFindUserAnswerOptions(
        normalizedId,
        selectedQuestion?.options
      );
      setAnswerOptionsByQuestionId((prev) => {
        const next = new Map(prev);
        next.set(normalizedId, options);
        return next;
      });
    } catch (err) {
      toastApiError(err);
    } finally {
      setLoadingAnswersFor((current) =>
        current === normalizedId ? "" : current
      );
    }
  };

  const canSearch = filters.every(
    (row) => row.questionId && Array.isArray(row.answers) && row.answers.length > 0
  );
  const languageMissing = !String(language ?? "").trim();
  const filtersDisabled =
    disabled || isSearching || isLoadingQuestions || languageMissing;
  const canDeleteFilters = filters.length > 1;

  return (
    <div className="space-y-4">
      {filters.map((row, index) => {
        const selectedQuestion = row.questionId
          ? questionsById.get(String(row.questionId))
          : null;
        const cachedAnswers =
          answerOptionsByQuestionId.get(String(row.questionId)) ??
          selectedQuestion?.options ??
          [];
        const answerOptions = mapOptionsToSelectOptions(cachedAnswers);
        const isLoadingAnswers =
          Boolean(row.questionId) &&
          loadingAnswersFor === String(row.questionId);
        const hasAnswerOptions = answerOptions.length > 0;
        const answersUnavailable =
          Boolean(row.questionId) &&
          !isLoadingQuestions &&
          !isLoadingAnswers &&
          !hasAnswerOptions;
        const selectedAnswers = Array.isArray(row.answers) ? row.answers : [];

        let answerPlaceholder = "Select question first";
        if (answersUnavailable) {
          answerPlaceholder = "No answers available";
        } else if (isLoadingAnswers) {
          answerPlaceholder = "Loading answers...";
        } else if (row.questionId) {
          answerPlaceholder = "Select Answer(s)";
        }

        let questionPlaceholder = "Select Question";
        if (languageMissing) {
          questionPlaceholder = "Project URL language required";
        } else if (isLoadingQuestions) {
          questionPlaceholder = "Loading questions...";
        }

        return (
          <div
            key={row.id}
            className={`grid gap-3 ${
              canDeleteFilters
                ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                : "md:grid-cols-2"
            }`}
          >
            <div className="min-w-0">
              <label className="admin-text mb-2 block text-sm font-semibold">
                {index === 0 ? "Question Filter" : `Question Filter ${index + 1}`}
              </label>
              <SearchableSelect
                inputClass={inputClass}
                value={row.questionId}
                onChange={(questionId) => handleQuestionChange(row.id, questionId)}
                options={questionSelectOptions}
                placeholder={questionPlaceholder}
                disabled={filtersDisabled}
                loading={isLoadingQuestions}
                loadingLabel="Loading questions..."
                emptyMessage="No questions found"
                searchPlaceholder="Search question..."
                searchable
                aria-label="Select question filter"
              />
            </div>

            <div className="min-w-0">
              <label className="admin-text mb-2 block text-sm font-semibold">
                Answer Filter
              </label>
              <SearchableMultiSelect
                inputClass={inputClass}
                value={selectedAnswers}
                onChange={(answers) => updateRow(row.id, { answers })}
                options={answerOptions}
                placeholder={answerPlaceholder}
                disabled={
                  disabled ||
                  isSearching ||
                  !row.questionId ||
                  answersUnavailable ||
                  isLoadingAnswers
                }
                emptyMessage="No answers available"
                searchPlaceholder="Search answer..."
                searchable
                aria-label="Select answer filter"
              />

              {selectedAnswers.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {selectedAnswers.map((answer) => (
                    <button
                      key={`${row.id}-${answer}`}
                      type="button"
                      onClick={() =>
                        updateRow(row.id, {
                          answers: selectedAnswers.filter((item) => item !== answer),
                        })
                      }
                      disabled={disabled || isSearching}
                      className="admin-text inline-flex max-w-full items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium"
                      style={{ borderColor: "var(--admin-header-surface-border)" }}
                      title={`Remove ${answer}`}
                    >
                      <span className="truncate">{answer}</span>
                      <X size={12} className="shrink-0 opacity-70" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateRow(row.id, { answers: [] })}
                    disabled={disabled || isSearching}
                    className="admin-text-muted text-xs font-semibold underline-offset-2 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              ) : null}
            </div>

            {canDeleteFilters ? (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handleRemoveFilter(row.id)}
                  disabled={filtersDisabled}
                  className="admin-icon-btn admin-text-subtle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent transition hover:border-[var(--admin-header-surface-border)] hover:text-[var(--admin-danger-text)] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Remove filter ${index + 1}`}
                  title="Remove filter"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onAddFilter}
          disabled={filtersDisabled}
          className="admin-btn-cancel inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
        >
          <Plus size={16} />
          Add More Filter
        </button>
        <button
          type="button"
          onClick={onSearch}
          disabled={filtersDisabled || !canSearch}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search size={16} />
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>
    </div>
  );
}

export default FindUserFilters;
