import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { DEMO_MESSAGES } from "../data/demoMessages";

const LIST_COLUMNS = ["S.No", "Name", "Subject", "Date", "Action"];

function MessagesPage({ isDarkMode }) {
  const navigate = useNavigate();

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Messages"
      searchPlaceholder="Search messages..."
      columns={LIST_COLUMNS}
      rows={DEMO_MESSAGES}
      rowIdKey="id"
      showStatus={false}
      actionVariant="view-edit"
      permissionModule="messages"
      nameAsText
      emptyMessage="No messages found"
      onView={(row) =>
        navigate(`/notifications/messages/${encodeURIComponent(String(row.id))}`)
      }
      showPagination
      nowrapAllCells
      getRowClassName={(row) => (!row?.isRead ? "font-semibold" : "")}
    />
  );
}

export default MessagesPage;
