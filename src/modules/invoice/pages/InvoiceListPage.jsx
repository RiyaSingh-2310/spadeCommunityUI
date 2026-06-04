import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";
import { downloadInvoicePdf } from "../utils/downloadInvoicePdf";

const CLIENTS = ["Alpha Corp", "Beta Labs", "Gamma Tech", "Delta Works"];
const PROJECTS = [
  "Brand Tracker Q2",
  "CX Pulse Study",
  "Product Launch Survey",
  "Employee NPS Wave",
];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `INV-${1001 + idx}`,
  client: CLIENTS[idx % CLIENTS.length],
  projectName: PROJECTS[idx % PROJECTS.length],
  invoiceDate: `${String(1 + (idx % 28)).padStart(2, "0")}/05/2026`,
  dueDate: `${String(15 + (idx % 14)).padStart(2, "0")}/06/2026`,
  grossAmount: `$${(2500 + idx * 350).toLocaleString()}`,
  status: idx % 3 === 0 ? "Inactive" : "Active",
}));

function InvoiceListPage({ isDarkMode }) {
  const { rows, onStatusToggle } = useListingPageActions({
    initialRows,
  });

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Invoices"
      subtitle="Manage invoice records here."
      searchPlaceholder="Search invoices..."
      actionLabel="Add Invoice"
      columns={[
        "ID",
        "Client",
        "Project Name",
        "Invoice Date",
        "Due Date",
        "Gross Amount",
        "Status",
        "Action",
      ]}
      rows={rows}
      rowIdKey="id"
      actionVariant="pdf-download"
      showDeleteAction={false}
      onPdfDownload={downloadInvoicePdf}
      onStatusToggle={onStatusToggle}
      permissionModule="invoices"
      searchFields={[
        "id",
        "client",
        "projectName",
        "invoiceDate",
        "dueDate",
        "grossAmount",
      ]}
      nowrapAllCells
    />
  );
}

export default InvoiceListPage;
