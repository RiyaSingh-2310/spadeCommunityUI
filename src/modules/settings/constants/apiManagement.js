/** Field options and helpers for API Key Management (backed by /api/api-keys). */

export const API_HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/** Values match backend `auth_type`. */
export const API_AUTH_TYPE_OPTIONS = [
  { value: "Bearer", label: "Bearer" },
  { value: "API Key", label: "API Key" },
  { value: "Basic", label: "Basic" },
  { value: "None", label: "None" },
  { value: "Custom Header", label: "Custom Header" },
];

/** Values match backend `status`: active | inactive */
export const API_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const API_MANAGEMENT_FORM_FIELDS = [
  "apiName",
  "apiLabel",
  "apiUserId",
  "apiKey",
  "baseUrl",
  "endpoint",
  "method",
  "authType",
  "headerName",
  "description",
  "status",
];

export const EMPTY_API_MANAGEMENT_FORM = {
  id: null,
  apiName: "",
  apiLabel: "",
  apiUserId: "",
  apiKey: "",
  baseUrl: "",
  endpoint: "",
  method: "POST",
  authType: "Bearer",
  headerName: "",
  description: "",
  status: "active",
  hasExistingKey: false,
};

export const API_MANAGEMENT_TABLE_COLUMNS = [
  "API Name",
  "API Label",
  "API User ID",
  "API Key",
  "Base URL",
  "Endpoint",
  "Method",
  "Auth Type",
  "Status",
  "Created At",
  "Updated At",
  "Actions",
];

export function maskApiSecret(value) {
  const text = String(value ?? "").trim();
  if (!text) return "—";
  // Prefer backend-provided mask (e.g. ***************3456) when present.
  if (/^\*+\w*$/.test(text) || /^[•]+/.test(text)) return text;
  if (text.length <= 4) return "••••••••••••";
  return `${"*".repeat(Math.max(12, text.length - 4))}${text.slice(-4)}`;
}

export function mapRecordToForm(record) {
  if (!record) return { ...EMPTY_API_MANAGEMENT_FORM };
  const rawKey = String(record.apiKey ?? record.api_key ?? "");
  const looksMasked =
    /^\*+\w*$/.test(rawKey) || /^[•]+/.test(rawKey) || Boolean(record.apiKeyMasked);
  // Never put a masked secret into the editable field; blank = keep existing on update.
  const editableKey = looksMasked ? "" : rawKey;

  return {
    id: record.id ?? null,
    apiName: String(record.apiName ?? record.api_name ?? ""),
    apiLabel: String(record.apiLabel ?? record.api_label ?? ""),
    apiUserId: String(record.apiUserId ?? record.api_user_id ?? ""),
    apiKey: editableKey,
    baseUrl: String(record.baseUrl ?? record.base_url ?? ""),
    endpoint: String(record.endpoint ?? ""),
    method: String(record.method ?? "POST").toUpperCase() || "POST",
    authType: String(record.authType ?? record.auth_type ?? "Bearer"),
    headerName: String(record.headerName ?? record.header_name ?? ""),
    description: String(record.description ?? ""),
    status: String(record.status ?? "active").toLowerCase() === "inactive"
      ? "inactive"
      : "active",
    hasExistingKey: Boolean(rawKey) || Boolean(record.apiKeyMasked),
  };
}
