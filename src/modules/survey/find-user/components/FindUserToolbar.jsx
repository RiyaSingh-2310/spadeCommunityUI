import SearchableSelect from "../../../../components/admin/SearchableSelect";
import { getAdminInputClass } from "../../../shared/utils/formStyles";

function FindUserToolbar({
  selectAll,
  onSelectAllChange,
  emailTemplate,
  onEmailTemplateChange,
  emailTemplateOptions = [],
  isLoadingEmailTemplates = false,
  onInvite,
  onListInvited,
  inviteDisabled,
  disabled = false,
  isInviting = false,
  visibleCount = 0,
  selectedCount = 0,
}) {
  const inputClass = getAdminInputClass();
  const canInvite = !inviteDisabled && !disabled && !isInviting;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap">
      <label className="admin-text flex shrink-0 cursor-pointer items-center gap-2.5 text-sm font-medium">
        <input
          type="checkbox"
          className="admin-checkbox"
          checked={selectAll}
          onChange={(e) => onSelectAllChange(e.target.checked)}
          disabled={disabled || visibleCount === 0}
        />
        <span className="whitespace-nowrap">
          Select All
          {visibleCount > 0 && (
            <span className="admin-text-muted ml-1 text-xs font-normal">
              ({selectedCount > 0 ? `${selectedCount} selected / ` : ""}
              {visibleCount} visible)
            </span>
          )}
        </span>
      </label>

      <div className="min-w-0 w-full sm:min-w-[220px] sm:flex-1 lg:max-w-sm">
        <SearchableSelect
          inputClass={inputClass}
          value={emailTemplate}
          onChange={(value) => onEmailTemplateChange(String(value ?? ""))}
          options={emailTemplateOptions}
          placeholder={
            isLoadingEmailTemplates
              ? "Loading templates..."
              : "Select Email Template"
          }
          disabled={disabled || isLoadingEmailTemplates}
          loading={isLoadingEmailTemplates}
          loadingLabel="Loading templates..."
          emptyMessage="No email templates found"
          searchPlaceholder="Search template..."
          aria-label="Select email template"
        />
      </div>

      <button
        type="button"
        onClick={onInvite}
        disabled={!canInvite}
        title={
          isInviting
            ? "Sending invites..."
            : canInvite
              ? "Invite selected users"
              : "Select at least one user and an email template"
        }
        className="h-10 w-full shrink-0 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isInviting
          ? "Inviting..."
          : `Invite${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
      </button>

      <button
        type="button"
        onClick={onListInvited}
        className="admin-btn-cancel h-10 w-full shrink-0 rounded-xl px-5 text-sm font-semibold sm:w-auto"
      >
        List Invited Users
      </button>
    </div>
  );
}

export default FindUserToolbar;
