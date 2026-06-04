import { API_ROUTES } from "../../config/api";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import { apiStatusToFormValue } from "../../modules/shared/utils/statusLabels";

function assertSuccess(data, fallbackMessage) {
  if (data?.success !== true) {
    throw new ApiError(data?.message || fallbackMessage, data);
  }
  return data;
}

/**
 * POST /api/clients/add
 * @param {{
 *   name: string,
 *   email: string,
 *   country: string,
 *   contact_no: string
 * }} payload
 */
export async function createClient(payload) {
  const body = {
    name: payload.name.trim(),
    email: payload.email.trim(),
    country: payload.country.trim(),
    contact_no: payload.contact_no?.trim() ?? "",
  };

  const data = await apiRequest(API_ROUTES.clients.create, {
    method: "POST",
    body,
  });

  return assertSuccess(data, "Failed to create client");
}

/**
 * PUT /api/clients/update/:id
 * @param {string|number} id
 * @param {{
 *   name: string,
 *   country: string,
 *   contact_no: string
 * }} payload
 */
export async function updateClient(id, payload) {
  const data = await apiRequest(API_ROUTES.clients.update(id), {
    method: "PUT",
    body: {
      name: payload.name.trim(),
      country: payload.country.trim(),
      contact_no: payload.contact_no?.trim() ?? "",
    },
  });

  return assertSuccess(data, "Failed to update client");
}

/**
 * Maps GET /api/clients/all client object to listing table row.
 * @param {object} client
 */
export function mapClientToRow(client) {
  const id = client?.client_id ?? client?.id;

  return {
    id,
    clientCode: client?.client_code ?? (id != null ? `CL-${id}` : ""),
    name: client?.client_name ?? client?.name ?? "",
    emailAddress: client?.client_email ?? client?.email ?? "",
    country: client?.country ?? "",
    contactNumber: client?.contact_no ?? client?.contactNumber ?? "",
    websiteUrl: client?.website ?? client?.website_url ?? "",
    status: apiStatusToFormValue(client?.status),
    adminName: client?.admin_name ?? "",
    createdAt: client?.created_at ?? "",
  };
}

/** GET /api/clients/all */
export async function getRecords() {
  const data = await apiRequest(API_ROUTES.clients.list);
  assertSuccess(data, "Failed to load clients");

  const clients = Array.isArray(data.clients) ? data.clients : [];

  return {
    ...data,
    count: data.count ?? clients.length,
    items: clients.map((client) => mapClientToRow(client)),
  };
}

/**
 * Maps API client to form fields (supports snake_case).
 * @param {object} client
 */
export function mapClientToForm(client) {
  return {
    name: client?.client_name ?? client?.name ?? "",
    email: client?.client_email ?? client?.email ?? "",
    country: client?.country ?? "",
    contactPerson: client?.contact_person ?? client?.contactPerson ?? "",
    contactNumber: client?.contact_no ?? client?.contactNumber ?? "",
    website: client?.website ?? client?.website_url ?? "",
    apiBaseUrl: client?.api_base_url ?? client?.apiBaseUrl ?? "",
    apiSecretKey: client?.api_secret_key ?? client?.apiSecretKey ?? "",
    passwordType: client?.password_type ?? client?.passwordType ?? "",
    apiHeaderKey: client?.api_header_key ?? client?.apiHeaderKey ?? "",
    status: apiStatusToFormValue(client?.status),
  };
}
