import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import CommunityUserExpandableDetails from "../components/CommunityUserExpandableDetails";
import CommunityUsersToolbar from "../components/CommunityUsersToolbar";
import {
  deleteRecord,
  getRecords,
  resendEmail,
  updateStatus,
} from "../services/communityUsersApi";

const LIST_COLUMNS = [
  "ID",
  "Name",
  "Email Address",
  "Mobile Number",
  "Status",
  "Action",
];

const DEFAULT_FILTERS = {
  status: "all",
  prescreenCompleted: "all",
  emailVerified: "all",
};

function CommunityUsersPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedRowIds, setSelectedRowIds] = useState(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkResendOpen, setBulkResendOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchUsers = useCallback(
    async (params) => getRecords({ ...params, filters }),
    [filters]
  );

  const {
    rows: users,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
  } = useApiListing({ fetchFn: fetchUsers, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(refresh);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows: users,
    columnLabel: "Name",
  });

  const visibleRowIds = useMemo(
    () => users.map((user) => String(user.id)),
    [users]
  );

  const allVisibleSelected =
    visibleRowIds.length > 0 && visibleRowIds.every((rowId) => selectedRowIds.has(rowId));

  const someVisibleSelected =
    visibleRowIds.some((rowId) => selectedRowIds.has(rowId)) && !allVisibleSelected;

  const handleFiltersChange = useCallback(
    (nextFilters) => {
      setFilters(nextFilters);
      handlePageChange(1);
    },
    [handlePageChange]
  );

  const handleBulkSelectChange = useCallback(
    (checked) => {
      if (checked) {
        setSelectedRowIds(new Set(visibleRowIds));
        return;
      }
      setSelectedRowIds(new Set());
    },
    [visibleRowIds]
  );

  const handleDeleteRequest = (row) => {
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      const data = await deleteRecord(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedRowIds((prev) => {
        const next = new Set(prev);
        next.delete(String(deleteTarget.id));
        return next;
      });
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteRequest = useCallback(() => {
    if (selectedRowIds.size === 0) return;
    setBulkDeleteOpen(true);
  }, [selectedRowIds]);

  const handleBulkDeleteCancel = useCallback(() => {
    if (isDeleting) return;
    setBulkDeleteOpen(false);
  }, [isDeleting]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    const ids = Array.from(selectedRowIds);
    if (ids.length === 0) return;

    setIsDeleting(true);
    try {
      await Promise.all(ids.map((userId) => deleteRecord(userId)));
      setBulkDeleteOpen(false);
      setSelectedRowIds(new Set());
      toastApiSuccess({ message: "Selected panelists deleted successfully." });
      await refresh();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedRowIds, refresh]);

  const handleBulkResendRequest = useCallback(() => {
    if (selectedRowIds.size === 0) return;
    setBulkResendOpen(true);
  }, [selectedRowIds]);

  const handleBulkResendCancel = useCallback(() => {
    if (isResending) return;
    setBulkResendOpen(false);
  }, [isResending]);

  const handleBulkResendConfirm = useCallback(async () => {
    const ids = Array.from(selectedRowIds);
    if (ids.length === 0 || isResending) return;

    setIsResending(true);
    try {
      await Promise.all(ids.map((userId) => resendEmail(userId)));
      setBulkResendOpen(false);
      toastApiSuccess({
        message: `Verification email resent to ${ids.length} panelist(s).`,
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsResending(false);
    }
  }, [selectedRowIds, isResending]);

  const handleResendEmail = useCallback(
    async (row) => {
      if (!row?.id || isResending) return;

      setIsResending(true);
      try {
        const data = await resendEmail(row.id);
        toastApiSuccess(data);
      } catch (error) {
        toastApiError(error);
      } finally {
        setIsResending(false);
      }
    },
    [isResending]
  );

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    setStatusUpdatingId(row.id);

    try {
      const data = await updateStatus(row.id, nextStatus);
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Panelists"
        searchPlaceholder="Search User"
        columns={LIST_COLUMNS}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="id"
        permissionModule="community_users"
        actionVariant="community-user"
        isLoading={isLoading}
        emptyMessage="No users found"
        onView={(row) => navigate(`/community-users/${encodeURIComponent(String(row.id))}`)}
        onEdit={(row) =>
          navigate(`/community-users/edit/${encodeURIComponent(String(row.id))}`)
        }
        onDelete={handleDeleteRequest}
        onRewardLog={(row) =>
          navigate(`/community-users/${encodeURIComponent(String(row.id))}/reward-log`)
        }
        onResendEmail={handleResendEmail}
        onStatusToggle={handleStatusToggle}
        onSearch={handleSearch}
        totalRecords={totalRecords}
        serverPaginated
        serverSearch
        paginationPage={currentPage}
        onPaginationPageChange={handlePageChange}
        paginationPageSize={pageSize}
        onPaginationPageSizeChange={handlePageSizeChange}
        showPagination
        nowrapAllCells
        nameAsText
        selectable
        hideSelectAllCheckbox
        selectedRowIds={selectedRowIds}
        onSelectedRowIdsChange={setSelectedRowIds}
        renderToolbar={(toolbarProps) => (
          <CommunityUsersToolbar
            isDarkMode={isDarkMode}
            query={toolbarProps.query}
            onQueryChange={toolbarProps.onQueryChange}
            onDebouncedSearch={toolbarProps.onDebouncedSearch}
            searchPlaceholder={toolbarProps.searchPlaceholder}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            onSelectAllChange={handleBulkSelectChange}
            onBulkDeleteRequest={handleBulkDeleteRequest}
            onBulkResendRequest={handleBulkResendRequest}
            selectedCount={selectedRowIds.size}
            disabled={isLoading || isDeleting}
            isResending={isResending}
          />
        )}
        renderExpandedContent={(row) => <CommunityUserExpandableDetails row={row} />}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <DeleteConfirmModal
        isOpen={bulkDeleteOpen}
        onCancel={handleBulkDeleteCancel}
        onConfirm={handleBulkDeleteConfirm}
        isDeleting={isDeleting}
        title="Delete Selected"
        message="Are you sure you want to delete selected records?"
      />

      <DeleteConfirmModal
        isOpen={bulkResendOpen}
        onCancel={handleBulkResendCancel}
        onConfirm={handleBulkResendConfirm}
        isDeleting={isResending}
        title="Resend Email"
        message="Are you sure you want to resend email to the selected panelists?"
        confirmLabel="Send Email"
        confirmingLabel="Sending..."
        confirmClassName="admin-btn-primary flex h-10 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:cursor-not-allowed"
      />
    </div>
  );
}

export default CommunityUsersPage;
