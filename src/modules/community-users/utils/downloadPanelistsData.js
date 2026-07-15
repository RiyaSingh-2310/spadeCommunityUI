/**
 * Temporary panelist CSV download helpers (mock).
 * Swap with API file/stream download when backend is ready.
 */

const CSV_HEADERS = [
  "ID",
  "Name",
  "Email Address",
  "Mobile Number",
  "Status",
  "Email Verified",
  "Questionnaire Completed",
  "Reward Points",
  "Joining Date",
];

function escapeCsvValue(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function panelistToCsvRow(panelist) {
  return [
    panelist?.id ?? "",
    panelist?.name ?? "",
    panelist?.emailAddress ?? panelist?.email ?? "",
    panelist?.mobileNumber ?? panelist?.phone ?? "",
    panelist?.status ?? "",
    panelist?.emailVerified ?? "",
    panelist?.prescreenCompleted ?? "",
    panelist?.rewardPoints ?? panelist?.balancePoint ?? "",
    panelist?.joiningDate ?? "",
  ]
    .map(escapeCsvValue)
    .join(",");
}

function buildPanelistsCsv(panelists = []) {
  const rows = Array.isArray(panelists) ? panelists : [];
  return [CSV_HEADERS.join(","), ...rows.map(panelistToCsvRow)].join("\n");
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function stamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

/**
 * Download one or more panelists as CSV (mock).
 * @param {object|object[]} panelistOrList
 * @param {{ filename?: string }} [options]
 */
export function downloadPanelistsData(panelistOrList, options = {}) {
  const rows = Array.isArray(panelistOrList)
    ? panelistOrList
    : panelistOrList
      ? [panelistOrList]
      : [];

  if (rows.length === 0) {
    throw new Error("No panelist data available to download.");
  }

  const csv = buildPanelistsCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const filename =
    options.filename ||
    (rows.length === 1
      ? `panelist-${String(rows[0]?.id ?? "export")}.csv`
      : `panelists-export-${stamp()}.csv`);

  triggerBlobDownload(blob, filename);
  return { success: true, count: rows.length, filename };
}
