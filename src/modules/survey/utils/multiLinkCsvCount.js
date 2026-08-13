/**
 * Count valid Multi-Link CSV rows the same way the backend normalizes them:
 * non-empty first-column Live_Link values (header row skipped when present).
 */

/**
 * @param {string} csvText
 * @returns {string[]}
 */
export function parseValidMultiLinkCsvLinks(csvText) {
  const lines = String(csvText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase().replace(/\s+/g, "");
  const startIndex =
    header.includes("live_link") ||
    header.includes("livelink") ||
    header.includes("link_live")
      ? 1
      : 0;

  const links = [];
  for (const line of lines.slice(startIndex)) {
    const firstCell =
      line.split(",")[0]?.trim().replace(/^"|"$/g, "") ?? "";
    if (!firstCell || firstCell.startsWith("#")) continue;
    links.push(firstCell);
  }
  return links;
}

/**
 * @param {string} csvText
 * @returns {number}
 */
export function countValidMultiLinkCsvLinks(csvText) {
  return parseValidMultiLinkCsvLinks(csvText).length;
}

/**
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(reader.error || new Error("Unable to read CSV file."));
    reader.readAsText(file);
  });
}

/**
 * @param {File[]|File|null|undefined} files
 * @returns {Promise<number>}
 */
export async function countValidMultiLinkCsvFiles(files) {
  const list = Array.isArray(files) ? files.filter(Boolean) : files ? [files] : [];
  if (list.length === 0) return 0;

  let total = 0;
  for (const file of list) {
    const text = await readFileAsText(file);
    total += countValidMultiLinkCsvLinks(text);
  }
  return total;
}

/** Backend message for Sample Size vs CSV link count mismatch. */
export const SAMPLE_SIZE_CSV_MISMATCH_MESSAGE =
  "Sample size and no. of links not equal";
