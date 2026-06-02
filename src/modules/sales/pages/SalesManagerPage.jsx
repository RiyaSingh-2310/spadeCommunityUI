import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "SM-01", name: "Arun Kumar", status: "Active", action: "" },
  { id: "SM-02", name: "Meera Singh", status: "Inactive", action: "" },
  { id: "SM-03", name: "Dev Patel", status: "Active", action: "" },
];

function SalesManagerPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Sales Manager"
      subtitle="Manage sales manager records here."
      searchPlaceholder="Search sales managers..."
      actionLabel="Add Sales Manager"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default SalesManagerPage;
