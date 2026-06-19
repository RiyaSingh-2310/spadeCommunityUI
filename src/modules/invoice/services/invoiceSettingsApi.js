import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { resolveMediaUrl } from "../../shared/utils/userAvatar";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function extractSettingsRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.id != null) return data;
  return null;
}

export function mapInvoiceSettingsToForm(record) {
  const logoImage = resolveMediaUrl(record?.logo_image ?? record?.logoImage ?? "") ?? "";

  return {
    id: record?.id ?? null,
    address: record?.address ?? "",
    paymentTerms: record?.payment_term ?? record?.paymentTerms ?? "",
    footerContent: record?.footer_content ?? record?.footerContent ?? "",
    logoImage,
    updatedAt: record?.updated_at ?? record?.updatedAt ?? "",
  };
}

/** GET /api/invoice/settings */
export async function fetchInvoiceSettings() {
  const data = await apiRequest(API_ROUTES.invoice.settings);
  assertSuccess(data);

  const record = extractSettingsRecord(data);
  if (!record) {
    throw new ApiError("Invoice settings not found.", data);
  }

  return mapInvoiceSettingsToForm(record);
}

/**
 * PUT /api/invoice/settings
 * @param {{ address: string, paymentTerms: string, footerContent: string, logoFile?: File | null }} payload
 */
export async function updateInvoiceSettings(payload) {
  const body = new FormData();
  body.append("address", String(payload.address ?? "").trim());
  body.append("payment_term", String(payload.paymentTerms ?? "").trim());
  body.append("footer_content", String(payload.footerContent ?? "").trim());

  if (payload.logoFile instanceof File) {
    body.append("logo_image", payload.logoFile);
  }

  const data = await apiRequest(API_ROUTES.invoice.settings, {
    method: "PUT",
    body,
  });

  assertSuccess(data);

  const record = extractSettingsRecord(data);
  return {
    ...data,
    form: record ? mapInvoiceSettingsToForm(record) : null,
  };
}
