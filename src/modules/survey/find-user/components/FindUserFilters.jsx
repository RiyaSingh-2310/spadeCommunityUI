import { Plus, Search } from "lucide-react";
import SearchableSelect from "../../../../components/admin/SearchableSelect";
import { mapCountryToSelectOption } from "../../../shared/utils/dropdownSearch";
import { getAdminInputClass } from "../../../shared/utils/formStyles";
import { useCountries } from "../../../shared/hooks/useCountries";
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
  const { countries } = useCountries();
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
        const answerOptions =
          row.questionId === "country"
            ? countries.map((country) => mapCountryToSelectOption(country))
            : getAnswersForQuestion(row.questionId).map((opt) => ({
                value: opt,
                label: opt,
              }));

        return (
          <div key={row.id} className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                {index === 0 ? "Question Filter" : `Question Filter ${index + 1}`}
              </label>
              <SearchableSelect
                inputClass={inputClass}
                value={row.questionId}
                onChange={(questionId) =>
                  updateRow(row.id, { questionId, answer: "" })
                }
                options={QUESTION_OPTIONS.map((q) => ({
                  value: q.id,
                  label: q.label,
                }))}
                placeholder="Select Question"
                disabled={disabled || isSearching}
                searchPlaceholder="Search question..."
                aria-label="Select question filter"
              />
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Answer Filter
              </label>
              <SearchableSelect
                inputClass={inputClass}
                value={row.answer}
                onChange={(answer) => updateRow(row.id, { answer })}
                options={answerOptions}
                placeholder={row.questionId ? "Select Answer" : "Select question first"}
                disabled={disabled || isSearching || !row.questionId}
                searchPlaceholder="Search answer..."
                aria-label="Select answer filter"
              />
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
