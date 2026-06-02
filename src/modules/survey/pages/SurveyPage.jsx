import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "SV-11", name: "Citizen Survey", status: "Active", action: "" },
  { id: "SV-12", name: "Waste Survey", status: "Inactive", action: "" },
];

function SurveyPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Survey"
      subtitle="Manage survey records here."
      searchPlaceholder="Search surveys..."
      actionLabel="Add Survey"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default SurveyPage;
