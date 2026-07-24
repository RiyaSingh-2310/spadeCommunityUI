import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { useMessages } from "../context/MessagesContext";
import { getMessages } from "../services/messagesApi";

const LIST_COLUMNS = ["S.No", "Name", "Subject", "Date & Time", "Action"];

function MessagesPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { removeMessage, refreshRecent, subscribe } = useMessages();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMessages = useCallback((params) => getMessages(params), []);

  const {
    rows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
  } = useApiListing({
    fetchFn: fetchMessages,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });

  useListingRefresh(refresh);

  useEffect(() => subscribe(() => {
    refresh();
  }), [subscribe, refresh]);

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
      const data = await removeMessage(deleteTarget.id);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await refresh();
      await refreshRecent({ silent: true });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Messages"
        searchPlaceholder="Search messages..."
        columns={LIST_COLUMNS}
        rows={rows}
        rowIdKey="id"
        showStatus={false}
        actionVariant="view-edit"
        permissionModule="messages"
        nameAsText
        isLoading={isLoading}
        emptyMessage="No messages found"
        onView={(row) =>
          navigate(`/notifications/messages/${encodeURIComponent(String(row.id))}`)
        }
        onDelete={handleDeleteRequest}
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
        getRowClassName={(row) => (!row?.isRead ? "font-semibold" : "")}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default MessagesPage;
