import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import TableCard from "../../../components/admin/TableCard";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import CommunityUserExpandableDetails from "../components/CommunityUserExpandableDetails";
import CommunityUsersFilterPanel from "../components/CommunityUsersFilterPanel";
import { deleteRecord, getRecords, updateStatus } from "../services/communityUsersApi";

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
};

function CommunityUsersPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchUsers = useCallback(
    async (params) => getRecords({ ...params, filters: appliedFilters }),
    [appliedFilters]
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

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setShowFilters(true);
    handlePageChange(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    handlePageChange(1);
  };

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
      toastApiSuccess({ message: "Selected users deleted successfully." });
      await refresh();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedRowIds, refresh]);

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

  const filterToolbar = useMemo(
    () => (
      <button
        type="button"
        onClick={() => setShowFilters((prev) => !prev)}
        className="admin-btn-cancel inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition hover:opacity-90"
      >
        <SlidersHorizontal size={15} />
        Filter
      </button>
    ),
    []
  );

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="List Users"
        searchPlaceholder="Search users..."
        columns={LIST_COLUMNS}
        rows={users}
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
        selectedRowIds={selectedRowIds}
        onSelectedRowIdsChange={setSelectedRowIds}
        onBulkDeleteRequest={handleBulkDeleteRequest}
        toolbarEnd={filterToolbar}
        renderExpandedContent={(row) => <CommunityUserExpandableDetails row={row} />}
      />

      {showFilters && (
        <TableCard title="Filters" isDarkMode={isDarkMode}>
          <div className="space-y-4">
            <CommunityUsersFilterPanel filters={filters} onChange={setFilters} />
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="h-10 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white transition hover:bg-[#0f9b49]"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="admin-btn-cancel h-10 rounded-xl px-4 text-sm font-semibold transition hover:opacity-90"
              >
                Reset
              </button>
            </div>
          </div>
        </TableCard>
      )}

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
        title="Delete Selected Users"
        message="Are you sure you want to delete the selected users?"
      />
    </div>
  );
}

export default CommunityUsersPage;
