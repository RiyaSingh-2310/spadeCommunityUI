import { API_ROUTES } from "../../../config/api";
import { downloadFileExport, sanitizeDownloadFilenamePart } from "../../../services/api/csvExport";

/**
 * Download an invoice PDF from the backend.
 *
 * TODO(backend): Implement GET /api/invoice/:id/pdf that returns a real
 * application/pdf byte stream (with %PDF- header) and optional
 * Content-Disposition filename.
 *
 * @param {{ id?: string|number }} row
 */
export async function downloadInvoicePdf(row) {
  const id = row?.id;
  if (id == null || String(id).trim() === "") {
    throw new Error("Invoice id is required to download the PDF.");
  }

  const safeId = sanitizeDownloadFilenamePart(id);
  return downloadFileExport(API_ROUTES.invoice.downloadPdf(id), {
    defaultFilename: `invoice-${safeId}.pdf`,
    accept: "application/pdf, application/octet-stream, */*",
    emptyMessage: "Empty PDF response. Nothing to download.",
    notFoundMessage: "Invoice PDF download is not available yet.",
    failureMessage: "Unable to download invoice PDF. Please try again.",
  });
}
