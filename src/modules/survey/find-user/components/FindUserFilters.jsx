import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import SearchableSelect from "../../../../components/admin/SearchableSelect";
import SearchableMultiSelect from "../../../../components/admin/SearchableMultiSelect";
import { getAdminInputClass } from "../../../shared/utils/formStyles";
import {
  getFindUserAnswerOptions,
  getFindUserQuestions,
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

function isChoiceQuestionType(questionType) {
  const type = String(questionType ?? "").trim().toLowerCase();
  return type === "dropdown" || type === "radio" || type === "select" || type === "checkbox";
}

function isFreeTextQuestionType(questionType) {
  const type = String(questionType ?? "").trim().toLowerCase();
  return (
    type === "textbox" ||
    type === "text" ||
    type === "number" ||
    type === "input" ||
    type === "textarea"
  );
}

function FindUserFilters({
  filters,
  onFiltersChange,
  onAddFilter,
  onRemoveFilter,
  onSearch,
  isSearching,
  disabled = false,
}) {
  const inputClass = getAdminInputClass();
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [answerOptionsByQuestionId, setAnswerOptionsByQuestionId] = useState(
    () => new Map()
  );
  const [loadingAnswersFor, setLoadingAnswersFor] = useState("");
  const [draftAnswersByRowId, setDraftAnswersByRowId] = useState(() => ({}));

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      setIsLoadingQuestions(true);
      try {
        // GET /api/find-user/questions — Find User questions only (not Prescreen)
        const nextQuestions = await getFindUserQuestions();
        if (cancelled) return;
        setQuestions(nextQuestions);
        setAnswerOptionsByQuestionId(new Map());
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
  }, []);

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
        value: String(question.id),
        label: String(question.question_title ?? "").trim(),
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
    setDraftAnswersByRowId((prev) => {
      if (!(rowId in prev)) return prev;
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const handleQuestionChange = async (rowId, questionId) => {
    updateRow(rowId, { questionId, answers: [] });
    setDraftAnswersByRowId((prev) => ({ ...prev, [rowId]: "" }));

    const normalizedId = String(questionId ?? "").trim();
    if (!normalizedId) return;

    // GET /api/find-user/questions/:id/answers — answers only from this API
    setLoadingAnswersFor(normalizedId);
    try {
      const options = await getFindUserAnswerOptions(normalizedId);
      setAnswerOptionsByQuestionId((prev) => {
        const next = new Map(prev);
        next.set(normalizedId, options);
        return next;
      });
    } catch (err) {
      toastApiError(err);
      setAnswerOptionsByQuestionId((prev) => {
        const next = new Map(prev);
        next.set(normalizedId, []);
        return next;
      });
    } finally {
      setLoadingAnswersFor((current) =>
        current === normalizedId ? "" : current
      );
    }
  };

  const addFreeTextAnswer = (rowId) => {
    const draft = String(draftAnswersByRowId[rowId] ?? "").trim();
    if (!draft) return;
    const row = filters.find((item) => item.id === rowId);
    const current = Array.isArray(row?.answers) ? row.answers : [];
    if (current.includes(draft)) {
      setDraftAnswersByRowId((prev) => ({ ...prev, [rowId]: "" }));
      return;
    }
    updateRow(rowId, { answers: [...current, draft] });
    setDraftAnswersByRowId((prev) => ({ ...prev, [rowId]: "" }));
  };

  // Search is enabled when every non-empty filter row is complete, and at least one is valid.
  const completeFilters = filters.filter(
    (row) => row.questionId && Array.isArray(row.answers) && row.answers.length > 0
  );
  const hasIncompleteFilter = filters.some(
    (row) =>
      (row.questionId && (!Array.isArray(row.answers) || row.answers.length === 0)) ||
      (!row.questionId && Array.isArray(row.answers) && row.answers.length > 0)
  );
  const canSearch = completeFilters.length > 0 && !hasIncompleteFilter;
  const filtersDisabled = disabled || isSearching || isLoadingQuestions;
  const canDeleteFilters = filters.length > 1;

  return (
    <div className="space-y-4">
      {filters.map((row, index) => {
        const selectedQuestion = row.questionId
          ? questionsById.get(String(row.questionId))
          : null;
        const cachedAnswers =
          answerOptionsByQuestionId.get(String(row.questionId)) ?? [];
        const answerOptions = mapOptionsToSelectOptions(cachedAnswers);
        const isLoadingAnswers =
          Boolean(row.questionId) &&
          loadingAnswersFor === String(row.questionId);
        const hasAnswerOptions = answerOptions.length > 0;
        const useFreeTextAnswers =
          Boolean(row.questionId) &&
          !isLoadingAnswers &&
          !hasAnswerOptions &&
          (isFreeTextQuestionType(selectedQuestion?.question_type) ||
            !isChoiceQuestionType(selectedQuestion?.question_type));
        const answersUnavailable =
          Boolean(row.questionId) &&
          !isLoadingQuestions &&
          !isLoadingAnswers &&
          !hasAnswerOptions &&
          isChoiceQuestionType(selectedQuestion?.question_type) &&
          !isFreeTextQuestionType(selectedQuestion?.question_type);
        const selectedAnswers = Array.isArray(row.answers) ? row.answers : [];
        const draftAnswer = draftAnswersByRowId[row.id] ?? "";

        let answerPlaceholder = "Select question first";
        if (answersUnavailable) {
          answerPlaceholder = "No answers available";
        } else if (isLoadingAnswers) {
          answerPlaceholder = "Loading answers...";
        } else if (useFreeTextAnswers) {
          answerPlaceholder = "Type an answer and press Add";
        } else if (row.questionId) {
          answerPlaceholder = "Select Answer(s)";
        }

        let questionPlaceholder = "Select Question";
        if (isLoadingQuestions) {
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

              {useFreeTextAnswers ? (
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    value={draftAnswer}
                    onChange={(event) =>
                      setDraftAnswersByRowId((prev) => ({
                        ...prev,
                        [row.id]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addFreeTextAnswer(row.id);
                      }
                    }}
                    placeholder={answerPlaceholder}
                    disabled={disabled || isSearching || !row.questionId}
                    aria-label="Enter answer filter"
                  />
                  <button
                    type="button"
                    onClick={() => addFreeTextAnswer(row.id)}
                    disabled={
                      disabled ||
                      isSearching ||
                      !row.questionId ||
                      !String(draftAnswer).trim()
                    }
                    className="admin-btn-cancel inline-flex h-11 shrink-0 items-center rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              ) : (
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
              )}

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
