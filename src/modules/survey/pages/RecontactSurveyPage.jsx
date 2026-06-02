import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "RSV-71", name: "Follow-up Survey A", status: "Active", action: "" },
  { id: "RSV-72", name: "Follow-up Survey B", status: "Inactive", action: "" },
];

function RecontactSurveyPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Recontact Survey"
      subtitle="Manage recontact survey records here."
      searchPlaceholder="Search recontact surveys..."
      actionLabel="Add Recontact"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default RecontactSurveyPage;
