import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import TableCard from "../../../../components/admin/TableCard";
import FindUserFilters from "../components/FindUserFilters";
import FindUserTable from "../components/FindUserTable";
import FindUserToolbar from "../components/FindUserToolbar";
import InvitedUsersModal from "../components/InvitedUsersModal";
import { useInfiniteUsers } from "../hooks/useInfiniteUsers";
import { inviteFindUsers, listFindUserEmailTemplateOptions } from "../services/findUserApi";
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

  const [filterRows, setFilterRows] = useState([createFilterRow()]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchVersion, setSearchVersion] = useState(0);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [emailTemplate, setEmailTemplate] = useState("");
  const [emailTemplateOptions, setEmailTemplateOptions] = useState([]);
  const [isLoadingEmailTemplates, setIsLoadingEmailTemplates] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [showInvitedModal, setShowInvitedModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

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
    setSelectAll(false);
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
    setSelectAll(false);
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(
        new Set(users.map((user) => getUserSelectionId(user)).filter(Boolean))
      );
    } else {
      setSelectedIds(new Set());
    }
  };

  const allVisibleSelected = useMemo(
    () =>
      users.length > 0 &&
      users.every((user) => selectedIds.has(getUserSelectionId(user))),
    [users, selectedIds]
  );

  const effectiveSelectAll = selectAll || allVisibleSelected;
  const inviteEnabled =
    selectedIds.size > 0 && Boolean(emailTemplate) && !isInviting;

  const handleInvite = async () => {
    if (!inviteEnabled) return;
    setIsInviting(true);
    try {
      const data = await inviteFindUsers({
        surveyId,
        userIds: [...selectedIds],
        emailTemplateId: emailTemplate,
      });
      toastApiSuccess(data);
      setSelectedIds(new Set());
      setSelectAll(false);
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
          selectAll={effectiveSelectAll}
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
        />
      </TableCard>

      <FindUserTable
        users={users}
        selectedIds={selectedIds}
        onToggleRow={handleToggleRow}
        onToggleAll={handleSelectAll}
        selectAll={effectiveSelectAll}
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
