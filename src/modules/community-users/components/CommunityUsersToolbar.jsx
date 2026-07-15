import DebouncedSearchInput from "../../../components/admin/DebouncedSearchInput";
import CommunityUsersBulkActions from "./CommunityUsersBulkActions";
import CommunityUsersInlineFilters from "./CommunityUsersInlineFilters";

function CommunityUsersToolbar({
  isDarkMode,
  query,
  onQueryChange,
  onDebouncedSearch,
  searchPlaceholder = "Search User",
  filters,
  onFiltersChange,
  allVisibleSelected,
  someVisibleSelected,
  onSelectAllChange,
  onBulkDeleteRequest,
  onBulkDownloadRequest,
  onBulkResendRequest,
  selectedCount,
  disabled = false,
  isResending = false,
  isDownloading = false,
}) {
  return (
    <div className="flex w-full min-w-0 flex-col-reverse gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between lg:gap-4">
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 lg:min-w-0 lg:flex-1">
        <DebouncedSearchInput
          value={query}
          onChange={onQueryChange}
          onDebouncedChange={onDebouncedSearch}
          placeholder={searchPlaceholder}
          isDarkMode={isDarkMode}
          className="min-w-0 w-full shrink-0 sm:min-w-[12rem] sm:flex-1"
          maxWidthClass="sm:max-w-none lg:max-w-[340px]"
        />
        <CommunityUsersBulkActions
          allVisibleSelected={allVisibleSelected}
          someVisibleSelected={someVisibleSelected}
          onSelectAllChange={onSelectAllChange}
          onBulkDeleteRequest={onBulkDeleteRequest}
          onBulkDownloadRequest={onBulkDownloadRequest}
          onBulkResendRequest={onBulkResendRequest}
          selectedCount={selectedCount}
          disabled={disabled}
          isResending={isResending}
          isDownloading={isDownloading}
        />
      </div>

      <CommunityUsersInlineFilters filters={filters} onChange={onFiltersChange} />
    </div>
  );
}

export default CommunityUsersToolbar;
