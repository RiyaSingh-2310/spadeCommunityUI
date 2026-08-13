import { Loader2 } from "lucide-react";
import DebouncedSearchInput from "../../../../components/admin/DebouncedSearchInput";

/**
 * Search + action toolbar for ModuleListingPage.
 * Preserves existing layout and button styles.
 */
function ModuleListingToolbar({
  renderToolbar,
  query,
  handleQueryChange,
  onSearch,
  searchPlaceholder,
  isDarkMode,
  toolbarFilters,
  toolbarEnd,
  showSecondaryAction,
  onSecondaryActionClick,
  secondaryActionLabel,
  showAddButton,
  onActionClick,
  actionLabel,
  showCsvExportButton,
  onCsvExportClick,
  isCsvExporting,
  csvExportDisabled,
  csvExportLabel,
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {renderToolbar ? (
        <div className="w-full min-w-0">
          {renderToolbar({
            query,
            onQueryChange: handleQueryChange,
            onDebouncedSearch: onSearch,
            searchPlaceholder,
            isDarkMode,
          })}
        </div>
      ) : toolbarFilters ? (
        <div className="flex min-w-0 w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between">
          <DebouncedSearchInput
            value={query}
            onChange={handleQueryChange}
            onDebouncedChange={onSearch}
            placeholder={searchPlaceholder}
            isDarkMode={isDarkMode}
            className="min-w-0 w-full shrink-0 md:min-w-[12rem] md:flex-1"
            maxWidthClass="md:max-w-none lg:max-w-[340px]"
          />
          <div className="admin-toolbar-filters flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end md:w-auto">
            {toolbarFilters}
          </div>
        </div>
      ) : (
        <DebouncedSearchInput
          value={query}
          onChange={handleQueryChange}
          onDebouncedChange={onSearch}
          placeholder={searchPlaceholder}
          isDarkMode={isDarkMode}
          className="min-w-0 w-full lg:flex-1"
          maxWidthClass="lg:max-w-[340px]"
        />
      )}
      {(toolbarEnd || showSecondaryAction || showAddButton || showCsvExportButton) && (
        <div className="flex w-full shrink-0 flex-wrap items-center justify-stretch gap-2.5 sm:justify-end lg:w-auto">
          {toolbarEnd}
          {showSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryActionClick}
              className="admin-btn-cancel h-10 w-full rounded-xl px-4 text-sm font-semibold transition sm:w-auto"
            >
              {secondaryActionLabel}
            </button>
          )}
          {showAddButton && (
            <button
              type="button"
              onClick={onActionClick}
              className="admin-btn-primary w-full shrink-0 sm:w-auto"
            >
              {actionLabel}
            </button>
          )}
          {showCsvExportButton && (
            <button
              type="button"
              onClick={onCsvExportClick}
              disabled={isCsvExporting || csvExportDisabled || !onCsvExportClick}
              className="admin-btn-cancel inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
              title={
                csvExportDisabled || !onCsvExportClick
                  ? "CSV export is not available for this module yet."
                  : undefined
              }
            >
              {isCsvExporting ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : null}
              {isCsvExporting ? "Downloading..." : csvExportLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ModuleListingToolbar;
