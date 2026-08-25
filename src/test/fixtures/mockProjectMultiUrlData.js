/**
 * Mock store for project_multiple_Url records.
 * TODO(backend): Remove when projectMultiUrlApi.js is fully API-backed and
 * no longer imports this store for fallbacks.
 *
 * Aligns with DB: id, project_id, Live_Link, VenderURL, Venderid_Userid, UserType, Status
 * plus project_url_id (required by upload API / UI).
 */

let nextId = 1;
/** @type {Array<object>} */
let multiUrlRecords = [];

export const PROJECT_MULTI_URL_CSV_TEMPLATE = `Live_Link,VenderURL,Venderid_Userid,UserType,Status
https://spade.com/startsurvey?projectid=sp1234,www.adsurver.com?projectid=1234,XXXX/XYG,adsurver,active
`;

export const PROJECT_MULTI_URL_COLUMNS = [
  "ID",
  "Project ID",
  "Project URL ID",
  "Live Link",
  "Vendor URL",
  "Vendor ID",
  "User ID",
  "User Type",
  "Status",
];

function splitVendorUserId(value) {
  const text = String(value ?? "").trim();
  if (!text) return { vendorId: "", userId: "" };
  if (text.includes("/")) {
    const [vendorId, ...rest] = text.split("/");
    return { vendorId: vendorId ?? "", userId: rest.join("/") };
  }
  if (text.includes("_")) {
    const [vendorId, ...rest] = text.split("_");
    return { vendorId: vendorId ?? "", userId: rest.join("_") };
  }
  return { vendorId: text, userId: "" };
}

export function mapMultiUrlRecordToRow(record) {
  const { vendorId, userId } = splitVendorUserId(record?.Venderid_Userid);
  return {
    id: record?.id != null ? String(record.id) : "",
    projectId: record?.project_id != null ? String(record.project_id) : "",
    projectUrlId:
      record?.project_url_id != null ? String(record.project_url_id) : "",
    liveLink: record?.Live_Link ?? "",
    vendorUrl: record?.VenderURL ?? "",
    vendorId: record?.vendor_id ?? vendorId,
    userId: record?.user_id ?? userId,
    userType: record?.UserType ?? "",
    status: record?.Status || "Active",
  };
}

export function listMockMultiUrlsByProject(projectId, projectUrlId = "") {
  const pid = String(projectId ?? "");
  const urlId = String(projectUrlId ?? "").trim();
  return multiUrlRecords
    .filter((row) => String(row.project_id) === pid)
    .filter((row) => !urlId || String(row.project_url_id ?? "") === urlId)
    .map(mapMultiUrlRecordToRow);
}

/**
 * @param {{ projectId: string|number, projectUrlId: string|number, liveLinks: string[] }} params
 */
export function createMockMultiUrlsFromLiveLinks({
  projectId,
  projectUrlId,
  liveLinks = [],
}) {
  const created = [];
  for (const liveLink of liveLinks) {
    const link = String(liveLink ?? "").trim();
    if (!link) continue;
    const record = {
      id: nextId,
      project_id: Number(projectId) || projectId,
      project_url_id: projectUrlId === "" ? null : Number(projectUrlId) || projectUrlId,
      Live_Link: link,
      VenderURL: "",
      Venderid_Userid: "",
      vendor_id: "",
      user_id: "",
      UserType: "",
      Status: "Active",
    };
    nextId += 1;
    multiUrlRecords.push(record);
    created.push(mapMultiUrlRecordToRow(record));
  }
  return created;
}

export function parseLiveLinksFromCsvText(csvText) {
  const lines = String(csvText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase().replace(/\s+/g, "");
  const startIndex =
    header.includes("live_link") || header.includes("livelink") ? 1 : 0;

  return lines.slice(startIndex).map((line) => {
    const firstCell = line.split(",")[0]?.trim().replace(/^"|"$/g, "") ?? "";
    return firstCell;
  });
}
