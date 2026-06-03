import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `SV-${11 + idx}`,
  name: `Survey ${idx + 1}`,
  status: idx % 3 === 0 ? "Inactive" : "Active",
}));

function SurveyPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Survey"
      subtitle="Manage survey records here."
      searchPlaceholder="Search surveys..."
      actionLabel="Add Survey"
      columns={["S.No", "ID", "Name", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      nowrapAllCells
    />
  );
}

export default SurveyPage;
