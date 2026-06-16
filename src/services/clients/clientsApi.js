import { API_ROUTES } from "../../config/api";
import { formatCountryLabel, getCountries } from "../countries/countriesApi";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../modules/shared/utils/statusLabels";

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
 * PUT /api/clients/update/:id — status toggle from clients listing table.
 * @param {string|number} id
 * @param {{
 *   name: string,
 *   status: string,
 *   country?: string,
 *   contactNumber?: string,
 * }} payload
 */
export async function updateClientStatus(id, { name, status, country, contactNumber }) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid client id.", null);
  }

  const data = await apiRequest(API_ROUTES.clients.update(normalizedId), {
    method: "PUT",
    body: {
      name: String(name ?? "").trim(),
      country: String(country ?? "").trim(),
      contact_no: String(contactNumber ?? "").trim(),
      status: formValueToApiStatus(status),
    },
  });

  return assertSuccess(data, "Failed to update client");
}

/**
 * Maps GET /api/clients/all client object to listing table row.
 * @param {object} client
 */
function extractClientsList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.clients)) return data.clients;
  return [];
}

export function mapClientToRow(client) {
  const id = client?.client_id ?? client?.id;
  const countryValue = client?.country ?? "";

  return {
    id,
    clientCode: client?.client_code ?? (id != null ? `CL-${id}` : ""),
    name: client?.client_name ?? client?.name ?? "",
    emailAddress: client?.client_email ?? client?.email ?? "",
    country: countryValue ? formatCountryLabel(countryValue) : "—",
    countryValue,
    contactNumber: client?.contact_no ?? client?.contactNumber ?? "",
    websiteUrl: client?.website ?? client?.website_url ?? "",
    status: apiStatusToFormValue(client?.status),
    adminName: client?.admin_name ?? "",
    createdAt: client?.created_at ?? "",
  };
}

function normalizeClientId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid client id.", null);
  }
  return encodeURIComponent(normalizedId);
}

/** DELETE /api/clients/delete/:id */
export async function deleteRecord(id) {
  const normalizedId = normalizeClientId(id);
  const data = await apiRequest(API_ROUTES.clients.delete(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data, "Failed to delete client");
}

/** GET /api/clients/all */
export async function getRecords({ page, limit, search } = {}) {
  const [, data] = await Promise.all([
    getCountries(),
    apiRequest(appendListQuery(API_ROUTES.clients.list, { page, limit, search })),
  ]);
  assertSuccess(data, "Failed to load clients");

  const clients = extractClientsList(data);
  const total = extractListTotalFromResponse(data, clients.length);

  return {
    ...data,
    total,
    count: total,
    items: clients.map((client) => mapClientToRow(client)),
  };
}

/** GET client by id (resolved from list endpoint response). */
export async function getRecord(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid client id.", null);
  }

  const data = await apiRequest(API_ROUTES.clients.list);
  assertSuccess(data, "Failed to load clients");

  const clients = extractClientsList(data);
  const client = clients.find(
    (item) =>
      String(item?.client_id ?? item?.id ?? "") === normalizedId ||
      String(item?.id ?? "") === normalizedId
  );

  if (!client) {
    throw new ApiError("Client not found.", data);
  }

  return client;
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
