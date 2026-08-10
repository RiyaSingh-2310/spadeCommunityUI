import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import FormField from "../../../../components/admin/FormField";
import SearchableSelect from "../../../../components/admin/SearchableSelect";
import TableCard from "../../../../components/admin/TableCard";
import { getAdminInputClass } from "../../../shared/utils/formStyles";
import FindUserFilters from "../components/FindUserFilters";
import FindUserTable from "../components/FindUserTable";
import FindUserToolbar from "../components/FindUserToolbar";
import InvitedUsersModal from "../components/InvitedUsersModal";
import { useInfiniteUsers } from "../hooks/useInfiniteUsers";
import { inviteFindUsers, listFindUserEmailTemplateOptions } from "../services/findUserApi";
import { listProjectUrlsByProject } from "../../services/projectUrlsApi";
import {
  formatProjectUrlOptionLabel,
  isProjectUrlEligibleForInvite,
  normalizeProjectUrlAssignmentStatus,
} from "../../utils/projectUrlEligibility";
import CopyValueButton from "../../components/CopyValueButton";
import { dedupeSelectOptions } from "../../utils/dedupeSelectOptions";
import { toastApiError, toastApiSuccess } from "../../../../services/toast/apiToast";
import { getGroupSurveyBreadcrumbs } from "../../utils/groupSurveyNavigation";

function createFilterRow() {
  return {
    id: `filter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    questionId: "",
    answers: [],
  };
}

function getUserSelectionId(user) {
  return String(user?.panelistId || user?.id || "");
}

function FindUserPage({ isDarkMode }) {
  const { id: surveyId, groupId } = useParams();
  const location = useLocation();
  const isGroupView = Boolean(groupId);
  const surveyName = location.state?.surveyName || "Project";
  const inputClass = getAdminInputClass();

  const [filterRows, setFilterRows] = useState([createFilterRow()]);
  const [activeFilters, setActiveFilters] = useState([]);
  /** Start at 1 so panelists load immediately (empty filters) and invite selection is usable. */
  const [searchVersion, setSearchVersion] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [emailTemplate, setEmailTemplate] = useState("");
  const [emailTemplateOptions, setEmailTemplateOptions] = useState([]);
  const [isLoadingEmailTemplates, setIsLoadingEmailTemplates] = useState(false);
  const [showInvitedModal, setShowInvitedModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const [projectUrls, setProjectUrls] = useState([]);
  const [isLoadingProjectUrls, setIsLoadingProjectUrls] = useState(false);
  /** Explicit selection — never auto-select the first URL. */
  const [selectedProjectUrlId, setSelectedProjectUrlId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEmailTemplates() {
      setIsLoadingEmailTemplates(true);
      try {
        const options = await listFindUserEmailTemplateOptions();
        if (cancelled) return;
        setEmailTemplateOptions(options);
      } catch (err) {
        if (cancelled) return;
        setEmailTemplateOptions([]);
        toastApiError(err);
      } finally {
        if (!cancelled) setIsLoadingEmailTemplates(false);
      }
    }

    loadEmailTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectUrls() {
      if (!surveyId) {
        setProjectUrls([]);
        return;
      }
      setIsLoadingProjectUrls(true);
      try {
        const response = await listProjectUrlsByProject(surveyId);
        if (cancelled) return;
        const rows = Array.isArray(response?.data) ? response.data : [];
        setProjectUrls(rows);
      } catch (err) {
        if (cancelled) return;
        setProjectUrls([]);
        toastApiError(err);
      } finally {
        if (!cancelled) setIsLoadingProjectUrls(false);
      }
    }

    loadProjectUrls();
    return () => {
      cancelled = true;
    };
  }, [surveyId]);

  const selectedProjectUrl = useMemo(
    () =>
      projectUrls.find(
        (url) => String(url.id) === String(selectedProjectUrlId)
      ) ?? null,
    [projectUrls, selectedProjectUrlId]
  );

  const eligibleProjectUrlOptions = useMemo(
    () =>
      dedupeSelectOptions(
        projectUrls
          .filter((url) => isProjectUrlEligibleForInvite(url.status))
          .map((url) => ({
            value: String(url.id),
            label: formatProjectUrlOptionLabel(url, { includeStatus: true }),
          }))
          .filter((option) => option.value && option.value !== "undefined")
      ),
    [projectUrls]
  );

  const ineligibleProjectUrls = useMemo(
    () =>
      projectUrls.filter((url) => !isProjectUrlEligibleForInvite(url.status)),
    [projectUrls]
  );

  const {
    users,
    isLoading,
    hasSearched,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    onPageChange,
    onPageSizeChange,
    reset,
    refresh,
  } = useInfiniteUsers(surveyId, activeFilters, searchVersion);

  const handleSearch = () => {
    const valid = filterRows
      .filter(
        (row) =>
          row.questionId && Array.isArray(row.answers) && row.answers.length > 0
      )
      .map((row) => ({
        questionId: row.questionId,
        answers: row.answers,
      }));

    setActiveFilters(valid);
    setSelectedIds(new Set());
    reset();
    setSearchVersion((version) => version + 1);
  };

  const handleRemoveFilter = (rowId) => {
    setFilterRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== rowId);
    });
  };

  const handleToggleRow = (userId) => {
    const normalizedId = String(userId ?? "");
    if (!normalizedId) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(normalizedId)) next.delete(normalizedId);
      else next.add(normalizedId);
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    const pageIds = users
      .map((user) => getUserSelectionId(user))
      .filter(Boolean);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        pageIds.forEach((id) => next.add(id));
      } else {
        pageIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const allVisibleSelected = useMemo(
    () =>
      users.length > 0 &&
      users.every((user) => selectedIds.has(getUserSelectionId(user))),
    [users, selectedIds]
  );

  const hasEligibleProjectUrl = Boolean(
    selectedProjectUrl &&
      isProjectUrlEligibleForInvite(selectedProjectUrl.status)
  );

  const inviteEnabled =
    selectedIds.size > 0 &&
    Boolean(emailTemplate) &&
    hasEligibleProjectUrl &&
    !isInviting;

  const handleInvite = async () => {
    if (!inviteEnabled) return;
    setIsInviting(true);
    try {
      const data = await inviteFindUsers({
        surveyId,
        userIds: [...selectedIds],
        emailTemplateId: emailTemplate,
        projectUrlId: selectedProjectUrlId,
      });
      toastApiSuccess(data);
      setSelectedIds(new Set());
      // Refresh eligibility / assignment state from API after share.
      try {
        const response = await listProjectUrlsByProject(surveyId);
        const rows = Array.isArray(response?.data) ? response.data : [];
        setProjectUrls(rows);
      } catch {
        // Invitation already succeeded; eligibility refresh is best-effort.
      }
      refresh();
    } catch (err) {
      toastApiError(err);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Find User"
        subtitle={`Survey Name - ${surveyName}`}
        breadcrumbs={
          isGroupView
            ? getGroupSurveyBreadcrumbs(groupId, { currentLabel: "Find User" })
            : [
                { label: "Projects", to: "/survey" },
                { label: "Find User" },
              ]
        }
        isDarkMode={isDarkMode}
      />

      <TableCard title="Invitation Target" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Project">
            <input
              className={inputClass}
              value={surveyName}
              readOnly
              disabled
            />
          </FormField>
          <FormField
            label="Project URL"
            required
            hint="Only Active (or otherwise eligible) Project URLs can be used for a fresh invitation."
          >
            <SearchableSelect
              inputClass={inputClass}
              value={selectedProjectUrlId}
              onChange={(value) => setSelectedProjectUrlId(String(value ?? ""))}
              options={eligibleProjectUrlOptions}
              placeholder={
                isLoadingProjectUrls
                  ? "Loading Project URLs..."
                  : eligibleProjectUrlOptions.length === 0
                    ? "No eligible Project URLs"
                    : "Select Project URL"
              }
              searchPlaceholder="Search Project URL..."
              disabled={isLoadingProjectUrls || isInviting}
              loading={isLoadingProjectUrls}
              loadingLabel="Loading Project URLs..."
              emptyMessage="No eligible Project URLs found"
              aria-label="Project URL"
            />
          </FormField>
          {selectedProjectUrl ? (
            <>
              <FormField label="Project URL Code">
                <div className="flex items-stretch gap-2">
                  <input
                    className={`${inputClass} min-w-0 flex-1`}
                    value={selectedProjectUrl.projectUrlCode || "—"}
                    readOnly
                    disabled
                    aria-label="Project URL Code"
                  />
                  <CopyValueButton
                    value={selectedProjectUrl.projectUrlCode}
                    successMessage="Project URL Code copied"
                    label="Copy Project URL Code"
                  />
                </div>
              </FormField>
              <FormField label="URL Status">
                <input
                  className={inputClass}
                  value={normalizeProjectUrlAssignmentStatus(
                    selectedProjectUrl.status
                  )}
                  readOnly
                  disabled
                />
              </FormField>
            </>
          ) : null}
        </div>
        {ineligibleProjectUrls.length > 0 ? (
          <div className="mt-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-header-search-bg)] px-4 py-3">
            <p className="admin-text-muted mb-2 text-xs font-medium uppercase tracking-wide">
              Excluded from fresh invitation
            </p>
            <ul className="space-y-1 text-sm">
              {ineligibleProjectUrls.map((url) => (
                <li key={url.id} className="admin-text">
                  {formatProjectUrlOptionLabel(url, { includeStatus: true })}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </TableCard>

      <TableCard title="Filters" isDarkMode={isDarkMode}>
        <FindUserFilters
          filters={filterRows}
          onFiltersChange={setFilterRows}
          onAddFilter={() =>
            setFilterRows((prev) => [...prev, createFilterRow()])
          }
          onRemoveFilter={handleRemoveFilter}
          onSearch={handleSearch}
          isSearching={isLoading && users.length === 0}
        />
      </TableCard>

      <TableCard isDarkMode={isDarkMode}>
        <FindUserToolbar
          selectAll={allVisibleSelected}
          onSelectAllChange={handleSelectAll}
          emailTemplate={emailTemplate}
          onEmailTemplateChange={setEmailTemplate}
          emailTemplateOptions={emailTemplateOptions}
          isLoadingEmailTemplates={isLoadingEmailTemplates}
          onInvite={handleInvite}
          onListInvited={() => setShowInvitedModal(true)}
          inviteDisabled={!inviteEnabled}
          disabled={isInviting}
          isInviting={isInviting}
          visibleCount={users.length}
          selectedCount={selectedIds.size}
          inviteBlockedReason={
            !hasEligibleProjectUrl
              ? "Select an eligible Project URL before inviting"
              : !emailTemplate
                ? "Select an email template"
                : selectedIds.size === 0
                  ? "Select at least one panelist"
                  : ""
          }
        />
      </TableCard>

      <FindUserTable
        users={users}
        selectedIds={selectedIds}
        onToggleRow={handleToggleRow}
        onToggleAll={handleSelectAll}
        selectAll={allVisibleSelected}
        isLoading={isLoading}
        hasSearched={hasSearched}
        isDarkMode={isDarkMode}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <InvitedUsersModal
        isOpen={showInvitedModal}
        onClose={() => setShowInvitedModal(false)}
        isDarkMode={isDarkMode}
        surveyId={surveyId}
      />
    </div>
  );
}

export default FindUserPage;
