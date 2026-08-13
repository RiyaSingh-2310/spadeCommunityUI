import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  getProjectUrlsForFindUser,
  inviteFindUsers,
  listFindUserEmailTemplateOptions,
} from "../services/findUserApi";
import {
  formatProjectUrlOptionLabel,
  isProjectUrlEligibleForInvite,
  normalizeProjectUrlAssignmentStatus,
  normalizeProjectUrlLinkModeLabel,
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
  /** 0 = no search yet. Only increment when the user clicks Search. */
  const [searchVersion, setSearchVersion] = useState(0);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [emailTemplate, setEmailTemplate] = useState("");
  const [emailTemplateOptions, setEmailTemplateOptions] = useState([]);
  const [isLoadingEmailTemplates, setIsLoadingEmailTemplates] = useState(false);
  const [showInvitedModal, setShowInvitedModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const [projectUrls, setProjectUrls] = useState([]);
  const [isLoadingProjectUrls, setIsLoadingProjectUrls] = useState(false);
  const [projectUrlsError, setProjectUrlsError] = useState("");
  /** Explicit selection — never auto-select the first URL. */
  const [selectedProjectUrlId, setSelectedProjectUrlId] = useState("");
  const projectUrlsRequestIdRef = useRef(0);

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

  const loadProjectUrls = useCallback(async () => {
    const projectId = String(surveyId ?? "").trim();
    const requestId = ++projectUrlsRequestIdRef.current;

    // Clear previous project's selection and stale URL list immediately.
    setSelectedProjectUrlId("");
    setProjectUrls([]);
    setProjectUrlsError("");
    setFilterRows([createFilterRow()]);
    setActiveFilters([]);
    setSelectedIds(new Set());
    setSearchVersion(0);

    if (!projectId || projectId === "undefined" || projectId === "null") {
      setIsLoadingProjectUrls(false);
      return [];
    }

    setIsLoadingProjectUrls(true);
    try {
      const rows = await getProjectUrlsForFindUser(projectId);
      if (requestId !== projectUrlsRequestIdRef.current) return [];
      setProjectUrls(rows);
      setProjectUrlsError("");
      return rows;
    } catch (err) {
      if (requestId !== projectUrlsRequestIdRef.current) return [];
      setProjectUrls([]);
      setProjectUrlsError("Unable to load Project URLs. Please try again.");
      toastApiError(err);
      return [];
    } finally {
      if (requestId === projectUrlsRequestIdRef.current) {
        setIsLoadingProjectUrls(false);
      }
    }
  }, [surveyId]);

  useEffect(() => {
    loadProjectUrls();
  }, [loadProjectUrls]);

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
            label: formatProjectUrlOptionLabel(url, {
              includeStatus: false,
              includeLinkType: true,
              includeLinkMode: false,
            }),
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

  const handleProjectUrlChange = (value) => {
    const nextId = String(value ?? "").trim();
    setSelectedProjectUrlId(nextId);
    // Dependent filters + search results must not carry over across Project URLs.
    setFilterRows([createFilterRow()]);
    setActiveFilters([]);
    setSelectedIds(new Set());
    reset();
    setSearchVersion(0);
  };

  const handleSearch = () => {
    if (!String(selectedProjectUrlId ?? "").trim()) return;

    const hasIncomplete = filterRows.some(
      (row) =>
        !row.questionId ||
        !Array.isArray(row.answers) ||
        row.answers.length === 0
    );
    if (hasIncomplete) return;

    const valid = filterRows.map((row) => ({
      questionId: row.questionId,
      answers: row.answers,
    }));
    if (valid.length === 0) return;

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
      // Refresh eligibility / assignment state from API after invite.
      try {
        const rows = await getProjectUrlsForFindUser(surveyId);
        setProjectUrls(rows);
        const stillEligible = rows.some(
          (url) =>
            String(url.id) === String(selectedProjectUrlId) &&
            isProjectUrlEligibleForInvite(url.status)
        );
        if (!stillEligible) {
          setSelectedProjectUrlId("");
        }
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

  const projectUrlEmptyMessage = projectUrlsError
    ? projectUrlsError
    : "No available Project URLs for this project.";

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
            hint="Only Open (or otherwise eligible) Project URLs can be used for a fresh invitation."
          >
            {projectUrlsError ? (
              <div className="space-y-2">
                <p className="text-sm text-[var(--admin-danger-text)]" role="alert">
                  {projectUrlsError}
                </p>
                <button
                  type="button"
                  onClick={loadProjectUrls}
                  disabled={isLoadingProjectUrls || isInviting}
                  className="h-10 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input-bg)] px-4 text-sm font-semibold admin-text transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Try again
                </button>
              </div>
            ) : (
              <SearchableSelect
                inputClass={inputClass}
                value={selectedProjectUrlId}
                onChange={handleProjectUrlChange}
                options={eligibleProjectUrlOptions}
                placeholder={
                  isLoadingProjectUrls
                    ? "Loading Project URLs..."
                    : eligibleProjectUrlOptions.length === 0
                      ? "No available Project URLs for this project."
                      : "Select Project URL"
                }
                searchPlaceholder="Search Project URL..."
                disabled={
                  isLoadingProjectUrls ||
                  isInviting ||
                  eligibleProjectUrlOptions.length === 0
                }
                loading={isLoadingProjectUrls}
                loadingLabel="Loading Project URLs..."
                emptyMessage={projectUrlEmptyMessage}
                aria-label="Project URL"
              />
            )}
          </FormField>
          {selectedProjectUrl ? (
            <>
              <FormField label="Project URL ID">
                <input
                  className={inputClass}
                  value={selectedProjectUrl.id || "—"}
                  readOnly
                  disabled
                  aria-label="Project URL ID"
                />
              </FormField>
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
              <FormField label="Link Mode">
                <input
                  className={inputClass}
                  value={normalizeProjectUrlLinkModeLabel(
                    selectedProjectUrl.linkMode ?? selectedProjectUrl.link_mode
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
                  {formatProjectUrlOptionLabel(url, {
                    includeStatus: true,
                    includeLinkMode: false,
                  })}
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
          selectedProjectUrlId={selectedProjectUrlId}
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
              ? "Please select a Project URL."
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
