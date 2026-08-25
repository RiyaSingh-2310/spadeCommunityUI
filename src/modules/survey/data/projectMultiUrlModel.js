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
