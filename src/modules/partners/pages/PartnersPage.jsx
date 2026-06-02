import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "PT-1001", name: "Deepak Traders", status: "Active", action: "" },
  { id: "PT-1002", name: "Traver Recycling", status: "Inactive", action: "" },
  { id: "PT-1003", name: "Green Loop", status: "Active", action: "" },
];

function PartnersPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Partners"
      subtitle="Manage partner records here."
      searchPlaceholder="Search partners..."
      actionLabel="Add Partner"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default PartnersPage;
