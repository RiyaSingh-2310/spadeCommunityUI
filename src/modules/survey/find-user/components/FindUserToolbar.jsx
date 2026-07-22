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
  visibleCount = 0,
  selectedCount = 0,
}) {
  const inputClass = getAdminInputClass();
  const canInvite = !inviteDisabled && !disabled;

  return (
    <div className="space-y-4">
      <label className="admin-text flex cursor-pointer items-center gap-2.5 text-sm font-medium">
        <input
          type="checkbox"
          className="admin-checkbox"
          checked={selectAll}
          onChange={(e) => onSelectAllChange(e.target.checked)}
          disabled={disabled || visibleCount === 0}
        />
        Select All
        {visibleCount > 0 && (
          <span className="admin-text-muted text-xs">
            ({selectedCount > 0 ? `${selectedCount} selected / ` : ""}
            {visibleCount} visible)
          </span>
        )}
      </label>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <label className="admin-text mb-2 block text-sm font-semibold">
              Email Template
            </label>
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
              canInvite
                ? "Invite selected users"
                : "Select at least one user and an email template"
            }
            className="h-10 shrink-0 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Invite
            {selectedCount > 0 ? ` (${selectedCount})` : ""}
          </button>
        </div>
        <button
          type="button"
          onClick={onListInvited}
          className="admin-btn-cancel h-10 shrink-0 rounded-xl px-5 text-sm font-semibold"
        >
          List Invited Users
        </button>
      </div>
    </div>
  );
}

export default FindUserToolbar;
