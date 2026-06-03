import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `GSV-${41 + idx}`,
  name: `Group Survey ${idx + 1}`,
  status: idx % 4 === 0 ? "Inactive" : "Active",
}));

function GroupSurveyPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Group Survey"
      subtitle="Manage group survey records here."
      searchPlaceholder="Search group surveys..."
      actionLabel="Add Group Survey"
      columns={["S.No", "ID", "Name", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      nowrapAllCells
    />
  );
}

export default GroupSurveyPage;
