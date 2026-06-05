import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import TableCard from "../../../../components/admin/TableCard";
import FindUserFilters from "../components/FindUserFilters";
import FindUserTable from "../components/FindUserTable";
import FindUserToolbar from "../components/FindUserToolbar";
import InvitedUsersModal from "../components/InvitedUsersModal";
import { useInfiniteUsers } from "../hooks/useInfiniteUsers";
import { useIntersectionLoadMore } from "../hooks/useIntersectionLoadMore";
import { inviteFindUsers } from "../services/findUserApi";
import { toastApiError, toastApiSuccess } from "../../../../services/toast/apiToast";

function createFilterRow() {
  return {
    id: `filter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    questionId: "",
    answer: "",
  };
}

function FindUserPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id: surveyId } = useParams();
  const location = useLocation();
  const surveyName =
    location.state?.surveyName || "Lifestyle Evolution India";

  const [filterRows, setFilterRows] = useState([createFilterRow()]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchVersion, setSearchVersion] = useState(0);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [emailTemplate, setEmailTemplate] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [showInvitedModal, setShowInvitedModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const {
    users,
    isLoading,
    isLoadingMore,
    hasMore,
    hasSearched,
    loadMore,
    reset,
  } = useInfiniteUsers(surveyId, activeFilters, searchVersion);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const sentinelRef = useIntersectionLoadMore({
    onLoadMore: handleLoadMore,
    enabled: hasSearched && hasMore && !isLoading && !isLoadingMore,
  });

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

  const handleToggleRow = (userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(new Set(users.map((u) => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allVisibleSelected = useMemo(
    () => users.length > 0 && users.every((u) => selectedIds.has(u.id)),
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
        emailTemplate,
      });
      toastApiSuccess(data);
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
        breadcrumbs={[
          { label: "Survey", to: "/survey" },
          { label: "Find User" },
        ]}
        isDarkMode={isDarkMode}
        // rightContent={
        //   <button
        //     type="button"
        //     onClick={() => navigate("/survey")}
        //     className="admin-btn-cancel h-10 rounded-xl px-4 text-sm font-semibold"
        //   >
        //     Back to Survey
        //   </button>
        // }
      />

      <TableCard title="Filters" isDarkMode={isDarkMode}>
        <FindUserFilters
          filters={filterRows}
          onFiltersChange={setFilterRows}
          onAddFilter={() => setFilterRows((prev) => [...prev, createFilterRow()])}
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
          onInvite={handleInvite}
          onListInvited={() => setShowInvitedModal(true)}
          inviteDisabled={!inviteEnabled}
          disabled={isInviting}
          visibleCount={users.length}
        />
      </TableCard>

      <FindUserTable
        users={users}
        selectedIds={selectedIds}
        onToggleRow={handleToggleRow}
        onToggleAll={handleSelectAll}
        selectAll={effectiveSelectAll}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasSearched={hasSearched}
        hasMore={hasMore}
        sentinelRef={sentinelRef}
        isDarkMode={isDarkMode}
      />

      <InvitedUsersModal
        isOpen={showInvitedModal}
        onClose={() => setShowInvitedModal(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default FindUserPage;
