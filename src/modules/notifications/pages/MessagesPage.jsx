import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { useMessages } from "../context/MessagesContext";
import { getMessages } from "../services/messagesApi";

const LIST_COLUMNS = [
  "S.No",
  "Sender Name",
  "Sender Email",
  "Subject",
  "Read Status",
  "Date",
  "Action",
];

function MessagesPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { subscribe } = useMessages();

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
    fetchFn: getMessages,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });

  useListingRefresh(refresh);

  useEffect(() => subscribe(refresh), [subscribe, refresh]);

  return (
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
      emptyMessage="No messages found"
      isLoading={isLoading}
      onView={(row) =>
        navigate(`/notifications/messages/${encodeURIComponent(String(row.id))}`)
      }
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
  );
}

export default MessagesPage;
