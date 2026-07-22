import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import TableCard from "../../../../components/admin/TableCard";
import FindUserFilters from "../components/FindUserFilters";
import FindUserTable from "../components/FindUserTable";
import FindUserToolbar from "../components/FindUserToolbar";
import InvitedUsersModal from "../components/InvitedUsersModal";
import { useInfiniteUsers } from "../hooks/useInfiniteUsers";
import {
  extractProjectCode,
  extractProjectLanguage,
  extractProjectName,
  getFindUserQuestions,
  inviteFindUsers,
} from "../services/findUserApi";
import { getRecords as getEmailTemplates } from "../../../user-email-templates/services/userEmailTemplatesApi";
import { getRecord } from "../../services/surveyApi";
import { normalizeStatusKey } from "../../../shared/utils/statusLabels";
import { ApiError } from "../../../../services/api/ApiError";
import { toastApiError, toastApiSuccess } from "../../../../services/toast/apiToast";
import { getGroupSurveyBreadcrumbs } from "../../utils/groupSurveyNavigation";

function createFilterRow() {
  return {
    id: `filter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    questionId: "",
    answer: "",
  };
}

function getUserSelectionId(user) {
  return String(user?.panelistId || user?.id || "");
}

function FindUserPage({ isDarkMode }) {
  const { id: surveyId, groupId } = useParams();
  const location = useLocation();
  const isGroupView = Boolean(groupId);

  const [projectName, setProjectName] = useState(
    () => location.state?.surveyName || ""
  );
  const [projectCode, setProjectCode] = useState("");
  const [projectLanguage, setProjectLanguage] = useState("");
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
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectAndQuestions() {
      if (!surveyId) return;

      setIsLoadingQuestions(true);
      try {
        const project = await getRecord(surveyId);
        if (cancelled) return;

        const name = extractProjectName(project);
        const code = extractProjectCode(project);
        const language = extractProjectLanguage(project);

        if (name) setProjectName(name);
        setProjectCode(code);
        setProjectLanguage(language);

        if (!language) {
          setQuestions([]);
          toastApiError(
            new ApiError(
              "Project language is not set. Add a language in Project URLs first.",
              null
            )
          );
          return;
        }

        const nextQuestions = await getFindUserQuestions(language);
        if (cancelled) return;
        setQuestions(nextQuestions);
      } catch (err) {
        if (cancelled) return;
        setQuestions([]);
        toastApiError(err);
      } finally {
        if (!cancelled) setIsLoadingQuestions(false);
      }
    }

    loadProjectAndQuestions();
    return () => {
      cancelled = true;
    };
  }, [surveyId]);

  useEffect(() => {
    let cancelled = false;

    async function loadEmailTemplates() {
      setIsLoadingEmailTemplates(true);
      try {
        const result = await getEmailTemplates({ page: 1, limit: 100 });
        if (cancelled) return;

        const options = (result.items ?? [])
          .filter((template) => {
            if (template?.id == null || template.id === "") return false;
            const statusKey = normalizeStatusKey(template.status);
            return !statusKey || statusKey === "active";
          })
          .map((template) => ({
            value: String(template.id),
            label:
              template.title ||
              template.emailTitle ||
              template.templateKey ||
              `Template #${template.id}`,
          }));

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
  } = useInfiniteUsers(surveyId, activeFilters, searchVersion);

  const handleSearch = () => {
    const valid = filterRows
      .filter((r) => r.questionId && r.answer)
      .map((r) => ({ questionId: r.questionId, answer: r.answer }));
    setActiveFilters(valid);
    setSelectedIds(new Set());
    setSelectAll(false);
    reset();
    setSearchVersion((v) => v + 1);
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
      if (next.has(normalizedId)) {
        next.delete(normalizedId);
      } else {
        next.add(normalizedId);
      }
      return next;
    });
    setSelectAll(false);
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(
        new Set(users.map((u) => getUserSelectionId(u)).filter(Boolean))
      );
    } else {
      setSelectedIds(new Set());
    }
  };

  const allVisibleSelected = useMemo(
    () =>
      users.length > 0 &&
      users.every((u) => selectedIds.has(getUserSelectionId(u))),
    [users, selectedIds]
  );

  const effectiveSelectAll = selectAll || allVisibleSelected;
  const hasSelectedUsers = selectedIds.size > 0;
  const hasEmailTemplate = Boolean(String(emailTemplate ?? "").trim());
  const inviteEnabled = hasSelectedUsers && hasEmailTemplate && !isInviting;

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
    } catch (err) {
      toastApiError(err);
    } finally {
      setIsInviting(false);
    }
  };

  const headerSubtitle = [
    projectName ? `Survey Name - ${projectName}` : null,
    projectCode ? `Code - ${projectCode}` : null,
    projectLanguage
      ? `Language - ${projectLanguage.charAt(0).toUpperCase()}${projectLanguage.slice(1)}`
      : null,
  ]
    .filter(Boolean)
    .join("  |  ");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Find User"
        subtitle={headerSubtitle || "Find and invite users for this project"}
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
          onAddFilter={() => setFilterRows((prev) => [...prev, createFilterRow()])}
          onRemoveFilter={handleRemoveFilter}
          onSearch={handleSearch}
          isSearching={isLoading && users.length === 0}
          questions={questions}
          isLoadingQuestions={isLoadingQuestions}
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
