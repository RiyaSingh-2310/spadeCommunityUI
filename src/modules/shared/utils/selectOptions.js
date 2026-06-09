/**
 * @param {Array<string | { value: string, label?: string, searchText?: string }>} options
 */
export function toSelectOptions(options) {
  if (!Array.isArray(options)) return [];

  return options.map((option) => {
    if (option && typeof option === "object" && "value" in option) {
      const normalized = {
        value: String(option.value ?? ""),
        label: String(option.label ?? option.value ?? ""),
      };
      if (option.searchText != null) {
        normalized.searchText = String(option.searchText);
      }
      return normalized;
    }

    const value = String(option ?? "");
    return { value, label: value };
  });
}
