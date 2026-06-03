import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `RSV-${71 + idx}`,
  name: `Follow-up Survey ${String.fromCharCode(65 + (idx % 6))}`,
  status: idx % 3 === 0 ? "Inactive" : "Active",
}));

function RecontactSurveyPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Recontact Survey"
      subtitle="Manage recontact survey records here."
      searchPlaceholder="Search recontact surveys..."
      actionLabel="Add Recontact"
      columns={["S.No", "ID", "Name", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      nowrapAllCells
    />
  );
}

export default RecontactSurveyPage;
