import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import SearchableSelect from "../../../../components/admin/SearchableSelect";
import SearchableMultiSelect from "../../../../components/admin/SearchableMultiSelect";
import { getAdminInputClass } from "../../../shared/utils/formStyles";
import {
  getRecord as getScreeningQuestion,
  getRecords as getScreeningQuestions,
  getScreeningRowId,
  mapScreeningQuestionToForm,
} from "../../../../services/screening/screeningQuestionsApi";
import { normalizeStatusKey } from "../../../shared/utils/statusLabels";
import { toastApiError } from "../../../../services/toast/apiToast";

/**
 * @typedef {{ id: string, questionId: string, answers: string[] }} FilterRow
 */

/**
 * Reuses Panel Questionnaire option mapping for Answer Filter values.
 * @param {unknown} options
 * @returns {{ value: string, label: string }[]}
 */
export function mapScreeningOptionsToSelectOptions(options) {
  if (!Array.isArray(options)) return [];

  return options
    .map((option) => {
      if (typeof option === "string") {
        const value = option.trim();
        return value ? { value, label: value } : null;
      }

      if (!option || typeof option !== "object") return null;

      const label = String(
        option.label ??
          option.option_text ??
          option.optionText ??
          option.value ??
          option.mapped_option ??
          option.mappedOption ??
          ""
      ).trim();
      const value = String(
        option.value ??
          option.mapped_option ??
          option.mappedOption ??
          option.label ??
          ""
      ).trim();
      const answer = label || value;
      if (!answer) return null;
      return { value: answer, label: answer };
    })
    .filter(Boolean);
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
  const answersRequestRef = useRef({});
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [answersByRowId, setAnswersByRowId] = useState({});
  const [loadingAnswersByRowId, setLoadingAnswersByRowId] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      setIsLoadingQuestions(true);
      try {
        const result = await getScreeningQuestions({ page: 1, limit: 500 });
        if (cancelled) return;

        const nextQuestions = (result.items ?? [])
          .filter((item) => {
            const id = getScreeningRowId(item);
            if (id == null || id === "") return false;
            const statusKey = normalizeStatusKey(item.status);
            return !statusKey || statusKey === "active";
          })
          .map((item) => {
            const id = String(getScreeningRowId(item));
            const title = String(
              item.questionTitle ?? item.title ?? item.question_title ?? ""
            ).trim();
            const language = String(item.language ?? "").trim();
            const label = language ? `${title} (${language})` : title || `Question #${id}`;

            return {
              id,
              label,
              title,
              language,
              options: Array.isArray(item.options) ? item.options : [],
            };
          });

        setQuestions(nextQuestions);
      } catch (err) {
        if (cancelled) return;
        setQuestions([]);
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

  const questionSelectOptions = useMemo(
    () =>
      questions.map((question) => ({
        value: question.id,
        label: question.label,
      })),
    [questions]
  );

  const updateRow = (id, patch) => {
    onFiltersChange(
      filters.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const clearRowAnswerState = (rowId) => {
    delete answersRequestRef.current[rowId];
    setAnswersByRowId((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    setLoadingAnswersByRowId((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const handleRemoveFilter = (rowId) => {
    if (filters.length <= 1) return;
    clearRowAnswerState(rowId);
    onRemoveFilter?.(rowId);
  };

  const handleQuestionChange = async (rowId, questionId) => {
    updateRow(rowId, { questionId, answers: [] });
    answersRequestRef.current[rowId] = String(questionId ?? "");
    setAnswersByRowId((prev) => ({ ...prev, [rowId]: [] }));

    if (!questionId) {
      setLoadingAnswersByRowId((prev) => ({ ...prev, [rowId]: false }));
      return;
    }

    setLoadingAnswersByRowId((prev) => ({ ...prev, [rowId]: true }));

    try {
      const detail = await getScreeningQuestion(questionId);
      if (answersRequestRef.current[rowId] !== String(questionId)) return;

      const mapped = mapScreeningQuestionToForm(detail);
      const options = mapScreeningOptionsToSelectOptions(mapped.options);
      setAnswersByRowId((prev) => ({
        ...prev,
        [rowId]: options,
      }));
    } catch (err) {
      if (answersRequestRef.current[rowId] !== String(questionId)) return;

      const fallback = questions.find((q) => String(q.id) === String(questionId));
      setAnswersByRowId((prev) => ({
        ...prev,
        [rowId]: mapScreeningOptionsToSelectOptions(fallback?.options),
      }));
      toastApiError(err);
    } finally {
      if (answersRequestRef.current[rowId] === String(questionId)) {
        setLoadingAnswersByRowId((prev) => ({ ...prev, [rowId]: false }));
      }
    }
  };

  const canSearch = filters.every(
    (row) => row.questionId && Array.isArray(row.answers) && row.answers.length > 0
  );
  const filtersDisabled = disabled || isSearching || isLoadingQuestions;
  const canDeleteFilters = filters.length > 1;

  return (
    <div className="space-y-4">
      {filters.map((row, index) => {
        const isLoadingAnswers = Boolean(loadingAnswersByRowId[row.id]);
        const answerOptions = Array.isArray(answersByRowId[row.id])
          ? answersByRowId[row.id]
          : [];
        const hasAnswerOptions = answerOptions.length > 0;
        const answersUnavailable =
          Boolean(row.questionId) && !isLoadingAnswers && !hasAnswerOptions;
        const selectedAnswers = Array.isArray(row.answers) ? row.answers : [];

        let answerPlaceholder = "Select question first";
        if (isLoadingAnswers) {
          answerPlaceholder = "Loading answers...";
        } else if (answersUnavailable) {
          answerPlaceholder = "No answers available";
        } else if (row.questionId) {
          answerPlaceholder = "Select Answer(s)";
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
                placeholder={
                  isLoadingQuestions ? "Loading questions..." : "Select Question"
                }
                disabled={filtersDisabled}
                loading={isLoadingQuestions}
                loadingLabel="Loading questions..."
                emptyMessage="No questions found"
                searchPlaceholder="Search question..."
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
                  isLoadingAnswers ||
                  answersUnavailable
                }
                loading={isLoadingAnswers}
                loadingLabel="Loading answers..."
                emptyMessage="No answers available"
                searchPlaceholder="Search answer..."
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
