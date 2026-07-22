import { useRef, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import SearchableSelect from "../../../../components/admin/SearchableSelect";
import { getAdminInputClass } from "../../../shared/utils/formStyles";
import { getFindUserQuestionAnswers } from "../services/findUserApi";
import { toastApiError } from "../../../../services/toast/apiToast";

/**
 * @typedef {{ id: string, questionId: string, answer: string }} FilterRow
 * @typedef {{
 *   id: string,
 *   question_title: string,
 *   question_text?: string,
 * }} FindUserQuestion
 */

function FindUserFilters({
  filters,
  onFiltersChange,
  onAddFilter,
  onRemoveFilter,
  onSearch,
  isSearching,
  disabled = false,
  questions = [],
  isLoadingQuestions = false,
}) {
  const inputClass = getAdminInputClass();
  /** @type {React.MutableRefObject<Record<string, string>>} */
  const answersRequestRef = useRef({});
  /** @type {[Record<string, string[]>, Function]} */
  const [answersByRowId, setAnswersByRowId] = useState({});
  /** @type {[Record<string, boolean>, Function]} */
  const [loadingAnswersByRowId, setLoadingAnswersByRowId] = useState({});

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
    updateRow(rowId, { questionId, answer: "" });
    answersRequestRef.current[rowId] = String(questionId ?? "");
    setAnswersByRowId((prev) => ({ ...prev, [rowId]: [] }));

    if (!questionId) {
      setLoadingAnswersByRowId((prev) => ({ ...prev, [rowId]: false }));
      return;
    }

    setLoadingAnswersByRowId((prev) => ({ ...prev, [rowId]: true }));

    try {
      const options = await getFindUserQuestionAnswers(questionId);
      if (answersRequestRef.current[rowId] !== String(questionId)) return;
      setAnswersByRowId((prev) => ({
        ...prev,
        [rowId]: options,
      }));
    } catch (err) {
      if (answersRequestRef.current[rowId] !== String(questionId)) return;
      setAnswersByRowId((prev) => ({
        ...prev,
        [rowId]: [],
      }));
      toastApiError(err);
    } finally {
      if (answersRequestRef.current[rowId] === String(questionId)) {
        setLoadingAnswersByRowId((prev) => ({ ...prev, [rowId]: false }));
      }
    }
  };

  const questionSelectOptions = questions.map((q) => ({
    value: String(q.id),
    label: q.question_title || q.question_text || String(q.id),
  }));

  const canSearch = filters.every((row) => row.questionId && row.answer);
  const filtersDisabled = disabled || isSearching || isLoadingQuestions;
  const canDeleteFilters = filters.length > 1;

  return (
    <div className="space-y-4">
      {filters.map((row, index) => {
        const isLoadingAnswers = Boolean(loadingAnswersByRowId[row.id]);
        const answerOptionsRaw = answersByRowId[row.id];
        const answerOptions = Array.isArray(answerOptionsRaw)
          ? answerOptionsRaw.map((opt) => ({
              value: opt,
              label: opt,
            }))
          : [];
        const hasAnswerOptions = answerOptions.length > 0;
        const answersUnavailable =
          Boolean(row.questionId) && !isLoadingAnswers && !hasAnswerOptions;

        let answerPlaceholder = "Select question first";
        if (isLoadingAnswers) {
          answerPlaceholder = "Loading answers...";
        } else if (answersUnavailable) {
          answerPlaceholder = "No answers available";
        } else if (row.questionId) {
          answerPlaceholder = "Select Answer";
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
              <SearchableSelect
                inputClass={inputClass}
                value={row.answer}
                onChange={(answer) => updateRow(row.id, { answer })}
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
