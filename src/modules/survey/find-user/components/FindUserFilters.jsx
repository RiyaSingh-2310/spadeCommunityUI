import { Plus, Search } from "lucide-react";
import { getAdminInputClass } from "../../../shared/utils/formStyles";
import {
  getAnswersForQuestion,
  QUESTION_OPTIONS,
} from "../utils/filterOptions";

/**
 * @typedef {{ id: string, questionId: string, answer: string }} FilterRow
 */

function FindUserFilters({
  filters,
  onFiltersChange,
  onAddFilter,
  onSearch,
  isSearching,
  disabled = false,
}) {
  const inputClass = getAdminInputClass();

  const updateRow = (id, patch) => {
    onFiltersChange(
      filters.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const canSearch = filters.every((row) => row.questionId && row.answer);

  return (
    <div className="space-y-4">
      {filters.map((row, index) => {
        const answers = getAnswersForQuestion(row.questionId);
        return (
          <div
            key={row.id}
            className="grid gap-3 md:grid-cols-2"
          >
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                {index === 0 ? "Question Filter" : `Question Filter ${index + 1}`}
              </label>
              <select
                className={inputClass}
                value={row.questionId}
                onChange={(e) =>
                  updateRow(row.id, { questionId: e.target.value, answer: "" })
                }
                disabled={disabled || isSearching}
              >
                <option value="">Select Question</option>
                {QUESTION_OPTIONS.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Answer Filter
              </label>
              <select
                className={inputClass}
                value={row.answer}
                onChange={(e) => updateRow(row.id, { answer: e.target.value })}
                disabled={disabled || isSearching || !row.questionId}
              >
                <option value="">
                  {row.questionId ? "Select Answer" : "Select question first"}
                </option>
                {answers.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onAddFilter}
          disabled={disabled || isSearching}
          className="admin-btn-cancel inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
        >
          <Plus size={16} />
          Add More Filter
        </button>
        <button
          type="button"
          onClick={onSearch}
          disabled={disabled || isSearching || !canSearch}
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
