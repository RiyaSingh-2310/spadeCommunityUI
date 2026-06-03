import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `INS-${String(idx + 1).padStart(2, "0")}`,
  name: `Invoice Setting ${idx + 1}`,
  status: idx % 4 === 0 ? "Inactive" : "Active",
}));

function InvoiceSettingsPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Invoice Settings"
      subtitle="Manage invoice settings here."
      searchPlaceholder="Search invoice settings..."
      actionLabel="Add Invoice Setting"
      columns={["S.No", "ID", "Name", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      nowrapAllCells
    />
  );
}

export default InvoiceSettingsPage;
