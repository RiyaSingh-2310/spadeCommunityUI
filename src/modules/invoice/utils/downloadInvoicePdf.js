import { API_ROUTES } from "../../../config/api";
import { downloadFileExport, sanitizeDownloadFilenamePart } from "../../../services/api/csvExport";

/**
 * Download an invoice PDF from GET /api/invoice/:id/pdf.
 * Does not fabricate a PDF when the API fails or returns a non-file body.
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
