import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "SET-01", name: "Default Survey Settings", status: "Active", action: "" },
  { id: "SET-02", name: "Seasonal Survey Settings", status: "Inactive", action: "" },
];

function SurveySettingsPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Survey Settings"
      subtitle="Manage survey settings here."
      searchPlaceholder="Search survey settings..."
      actionLabel="Add Setting"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default SurveySettingsPage;
