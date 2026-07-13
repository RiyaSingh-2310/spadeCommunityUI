import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";

const NAMES = ["John Smith", "David Roy", "Ahmed Khan", "Priya Desai", "Emma Wilson"];
const SUBJECTS = ["Welcome Email", "Survey Invite", "Reward Update", "Password Reset", "Account Alert"];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `msg-${idx + 1}`,
  name: NAMES[idx % NAMES.length],
  subject: SUBJECTS[idx % SUBJECTS.length],
  date: `${String(1 + (idx % 28)).padStart(2, "0")}/06/2026`,
}));

function MessagesPage({ isDarkMode }) {
  const { rows, onDelete } = useListingPageActions({ initialRows });
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: "Subject",
  });

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Messages"
      searchPlaceholder="Search messages..."
      columns={["S.No", "Name", "Subject", "Date", "Action"]}
      rows={sortedRows}
      sortableColumns={sortableColumns}
      columnSort={columnSort}
      onColumnSort={onColumnSort}
      rowIdKey="id"
      showStatus={false}
      onDelete={onDelete}
      permissionModule="messages"
      nowrapAllCells
    />
  );
}

export default MessagesPage;
