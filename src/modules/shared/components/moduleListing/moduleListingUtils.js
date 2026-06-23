import { getColumnKey } from "../../utils/tableHelpers";

export function formatDescriptionForLineClamp(value, maxLines) {
  if (value === "-" || value === "—") return "—";
  const text = String(value);
  if (maxLines == null) return text;
  return text.replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n");
}

export function insertCheckboxBeforeName(headers, selectable) {
  if (!selectable) return headers;
  const nameIndex = headers.findIndex((header) => getColumnKey(header) === "name");
  if (nameIndex === -1) return headers;
  const next = [...headers];
  next.splice(nameIndex, 0, "");
  return next;
}
