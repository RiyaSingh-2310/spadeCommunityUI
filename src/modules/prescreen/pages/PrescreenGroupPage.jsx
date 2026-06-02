import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "PG-1001", name: "North Zone Group", status: "Active", action: "" },
  { id: "PG-1002", name: "South Zone Group", status: "Inactive", action: "" },
];

function PrescreenGroupPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Prescreen Group"
      subtitle="Manage prescreen groups here."
      searchPlaceholder="Search prescreen groups..."
      actionLabel="Add Group"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default PrescreenGroupPage;
