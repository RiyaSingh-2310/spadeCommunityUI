import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "RFQ-1001", name: "Steel Scrap", status: "Active", action: "" },
  { id: "RFQ-1002", name: "Plastic Bulk", status: "Inactive", action: "" },
  { id: "RFQ-1003", name: "E-Waste", status: "Active", action: "" },
];

function RfqPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="RFQ"
      subtitle="Manage RFQ records here."
      searchPlaceholder="Search RFQ..."
      actionLabel="Add RFQ"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default RfqPage;
