import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "INS-01", name: "Invoice Prefix Settings", status: "Active", action: "" },
  { id: "INS-02", name: "Tax Settings", status: "Inactive", action: "" },
];

function InvoiceSettingsPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Invoice Settings"
      subtitle="Manage invoice settings here."
      searchPlaceholder="Search invoice settings..."
      actionLabel="Add Invoice Setting"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default InvoiceSettingsPage;
