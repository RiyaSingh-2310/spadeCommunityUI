import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `INV-${1001 + idx}`,
  name: `Invoice ${idx + 1}`,
  status: idx % 3 === 0 ? "Inactive" : "Active",
}));

function InvoiceListPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Invoices"
      subtitle="Manage invoice records here."
      searchPlaceholder="Search invoices..."
      actionLabel="Add Invoice"
      columns={["S.No", "ID", "Name", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      nowrapAllCells
    />
  );
}

export default InvoiceListPage;
