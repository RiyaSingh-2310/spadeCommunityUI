import { useCallback } from "react";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { downloadInvoicePdf } from "../utils/downloadInvoicePdf";

const initialRows = [];

function InvoiceListPage({ isDarkMode }) {
  const { rows, onStatusToggle } = useListingPageActions({
    initialRows,
  });
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: "Project Name",
  });

  const handlePdfDownload = useCallback(async (row) => {
    try {
      const data = await downloadInvoicePdf(row);
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
    }
  }, []);

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
      rows={sortedRows}
      sortableColumns={sortableColumns}
      columnSort={columnSort}
      onColumnSort={onColumnSort}
      rowIdKey="id"
      actionVariant="pdf-download"
      showDeleteAction={false}
      onPdfDownload={handlePdfDownload}
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
