import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useMessages } from "../context/MessagesContext";
import { DEMO_MESSAGES } from "../data/demoMessages";

const LIST_COLUMNS = ["S.No", "Name", "Subject", "Date", "Action"];

function MessagesPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { subscribe } = useMessages();
  const [rows, setRows] = useState(() => [...DEMO_MESSAGES]);

  useEffect(() => {
    return subscribe(() => {
      setRows([...DEMO_MESSAGES]);
    });
  }, [subscribe]);

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
