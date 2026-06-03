import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `SET-${String(idx + 1).padStart(2, "0")}`,
  name: `Survey Setting ${idx + 1}`,
  status: idx % 4 === 0 ? "Inactive" : "Active",
}));

function SurveySettingsPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Survey Settings"
      subtitle="Manage survey settings here."
      searchPlaceholder="Search survey settings..."
      actionLabel="Add Setting"
      columns={["S.No", "ID", "Name", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      nowrapAllCells
    />
  );
}

export default SurveySettingsPage;
