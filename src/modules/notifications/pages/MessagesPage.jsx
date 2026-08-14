import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { useMessages } from "../context/MessagesContext";
import { getMessages } from "../services/messagesApi";

const LIST_COLUMNS = [
  "Sender Name",
  "Sender Email",
  "Subject",
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
    listError,
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
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: "Sender Name",
  });

  useEffect(() => subscribe(refresh), [subscribe, refresh]);

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Messages"
      searchPlaceholder="Search messages..."
      columns={LIST_COLUMNS}
      rows={sortedRows}
      sortableColumns={sortableColumns}
      columnSort={columnSort}
      onColumnSort={onColumnSort}
      rowIdKey="id"
      showStatus={false}
      actionVariant="view-edit"
      permissionModule="messages"
      nameAsText
      emptyMessage="No messages found"
      isLoading={isLoading}
        errorMessage={listError}
        onRetry={refresh}
      onView={(row) => {
        const messageId = String(row?.id ?? "").trim();
        if (!messageId || messageId === "undefined" || messageId === "null") {
          return;
        }
        navigate(`/messages/${encodeURIComponent(messageId)}`);
      }}
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
