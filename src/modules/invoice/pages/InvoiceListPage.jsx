import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "INV-1001", name: "Invoice Alpha", status: "Active", action: "" },
  { id: "INV-1002", name: "Invoice Beta", status: "Inactive", action: "" },
];

function InvoiceListPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Invoices"
      subtitle="Manage invoice records here."
      searchPlaceholder="Search invoices..."
      actionLabel="Add Invoice"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default InvoiceListPage;
