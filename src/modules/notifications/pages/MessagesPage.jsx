import ModuleListingPage from "../../shared/components/ModuleListingPage";

const NAMES = ["John Smith", "David Roy", "Ahmed Khan", "Priya Desai", "Emma Wilson"];
const SUBJECTS = ["Welcome Email", "Survey Invite", "Reward Update", "Password Reset", "Account Alert"];

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `msg-${idx + 1}`,
  name: NAMES[idx % NAMES.length],
  subject: SUBJECTS[idx % SUBJECTS.length],
  date: `${String(1 + (idx % 28)).padStart(2, "0")}/06/2026`,
}));

function MessagesPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Messages"
      searchPlaceholder="Search messages..."
      columns={["S.No", "Name", "Subject", "Date", "Action"]}
      rows={rows}
      rowIdKey="id"
      showStatus={false}
      nowrapAllCells
    />
  );
}

export default MessagesPage;
