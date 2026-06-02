import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "GSV-41", name: "Urban Group Survey", status: "Active", action: "" },
  { id: "GSV-42", name: "Rural Group Survey", status: "Inactive", action: "" },
];

function GroupSurveyPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Group Survey"
      subtitle="Manage group survey records here."
      searchPlaceholder="Search group surveys..."
      actionLabel="Add Group Survey"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default GroupSurveyPage;
