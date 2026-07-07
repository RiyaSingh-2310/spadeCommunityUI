import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import {
  extractListTotalFromResponse,
  safeMapListItems,
} from "../../shared/utils/listResponse";
import { appendListQuery } from "../../shared/utils/listQueryParams";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../shared/utils/statusLabels";
import { normalizeSearchQuery } from "../../shared/utils/searchQuery";
import {
  getCommunityUserById,
} from "../data/communityUsersStore";
import { normalizeRewardLogEntry } from "../utils/rewardLogUtils";

const LIST_LOAD_ERROR_MESSAGE = "Unable to load panelists. Please try again later.";

function isApiSuccess(data) {
  if (!data || typeof data !== "object") return false;
  const explicit = data.success;
  if (explicit === false || explicit === "false") return false;
  return explicit === true || explicit === "true" || explicit == null;
}

function assertSuccess(data, fallbackMessage = "") {
  if (!isApiSuccess(data)) {
    throw new ApiError(data?.message || data?.error || fallbackMessage, data);
  }
  return data;
}

function extractPanelistList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.panelists)) return data.panelists;
  return [];
}

function mapYesNoFromApi(value) {
  const normalized = String(value ?? "").toLowerCase().trim();
  if (normalized === "yes" || normalized === "1" || normalized === "true") return "Yes";
  if (normalized === "no" || normalized === "0" || normalized === "false") return "No";
  return "No";
}

function mapIsVerified(value) {
  if (value === 1 || value === "1" || value === true) return "Yes";
  if (value === 0 || value === "0" || value === false) return "No";
  return mapYesNoFromApi(value);
}

function formatPanelistDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractPanelistRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.panelist && typeof data.panelist === "object") {
    return data.panelist;
  }
  if (data.id != null) return data;
  return null;
}

function normalizePanelistId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid panelist id.", null);
  }
  return encodeURIComponent(normalizedId);
}

function buildPanelistFilterParams(filters = {}) {
  const extra = {};

  if (filters.status && filters.status !== "all") {
    extra.status = filters.status === "active" ? "active" : "inactive";
  }
  if (filters.emailVerified && filters.emailVerified !== "all") {
    extra.is_verified = filters.emailVerified === "yes" ? "1" : "0";
  }
  if (filters.prescreenCompleted && filters.prescreenCompleted !== "all") {
    extra.questionnaire = filters.prescreenCompleted === "yes" ? "yes" : "no";
  }

  return extra;
}

/** Maps panelist API record to edit form values. */
export function mapPanelistToForm(panelist) {
  return {
    name: panelist?.name ?? "",
    email: panelist?.email ?? panelist?.emailAddress ?? "",
    status: apiStatusToFormValue(panelist?.status),
  };
}

function buildPanelistUpdatePayload(payload) {
  const body = {};

  if (payload.name != null) {
    body.name = String(payload.name).trim();
  }
  if (payload.email != null) {
    body.email = String(payload.email).trim();
  } else if (payload.emailAddress != null) {
    body.email = String(payload.emailAddress).trim();
  }
  if (payload.status != null) {
    body.status = formValueToApiStatus(payload.status);
  }

  return body;
}

function toPanelistDetailRecord(panelist) {
  return {
    ...mapPanelistToListingRow(panelist),
    ...mapPanelistToForm(panelist),
    email: panelist?.email ?? panelist?.emailAddress ?? "",
    isVerified: mapIsVerified(panelist?.is_verified),
    balancePoint: panelist?.balance_point ?? panelist?.balancePoint ?? "",
    questionnaire: mapYesNoFromApi(panelist?.questionnaire),
    questionnaireUrl: panelist?.questionnaire_url ?? "",
    createdAt: panelist?.created_at ?? panelist?.createdAt ?? "",
    updatedAt: panelist?.updated_at ?? panelist?.updatedAt ?? "",
  };
}

async function findPanelistInList(id) {
  const targetId = String(id);

  const fetchListPage = async (page, limit, search = "") => {
    const path = appendListQuery(API_ROUTES.panelist.list, {
      page,
      limit,
      search: normalizeSearchQuery(search),
      alwaysIncludeEmpty: ["search"],
    });
    const data = await apiRequest(path);
    assertSuccess(data);
    return {
      panelists: extractPanelistList(data),
      totalPages:
        data.totalPages ??
        Math.max(
          1,
          Math.ceil(
            extractListTotalFromResponse(data, extractPanelistList(data).length) /
              (Number(limit) || 100),
          ) || 1,
        ),
    };
  };

  try {
    const searchData = await fetchListPage(1, 50, targetId);
    const searchMatch = searchData.panelists.find((panelist) => String(panelist.id) === targetId);
    if (searchMatch) {
      return toPanelistDetailRecord(searchMatch);
    }
  } catch {
    // Continue with paginated lookup.
  }

  let page = 1;
  let totalPages = 1;

  do {
    const listData = await fetchListPage(page, 100);
    totalPages = listData.totalPages;
    const match = listData.panelists.find((panelist) => String(panelist.id) === targetId);
    if (match) {
      return toPanelistDetailRecord(match);
    }
    page += 1;
  } while (page <= totalPages);

  return null;
}

/** Maps GET /api/panelist/list record to listing row shape. */
export function mapPanelistToListingRow(panelist) {
  return {
    id: panelist?.id,
    name: panelist?.name ?? "",
    emailAddress: panelist?.email ?? "",
    mobileNumber:
      panelist?.mobile_number ??
      panelist?.mobileNumber ??
      panelist?.mobile ??
      panelist?.contact_no ??
      "—",
    status: apiStatusToFormValue(panelist?.status),
    prescreenCompleted: mapYesNoFromApi(panelist?.questionnaire),
    emailVerified: mapIsVerified(panelist?.is_verified),
    rewardPoints: panelist?.balance_point ?? panelist?.balancePoint ?? "",
    joiningDate: formatPanelistDate(panelist?.created_at ?? panelist?.createdAt),
    ipAddress: panelist?.ip_address ?? panelist?.ipAddress ?? "—",
    createdAt: panelist?.created_at ?? panelist?.createdAt ?? "",
  };
}

/** GET /api/panelist/list */
export async function getRecords({ page = 1, limit = 10, search, filters } = {}) {
  const path = appendListQuery(API_ROUTES.panelist.list, {
    page,
    limit,
    search: normalizeSearchQuery(search),
    extra: buildPanelistFilterParams(filters),
    alwaysIncludeEmpty: ["search"],
  });

  try {
    const data = await apiRequest(path);
    assertSuccess(data);

    const panelists = extractPanelistList(data);
    const total = extractListTotalFromResponse(data, panelists.length);
    const items = safeMapListItems(panelists, (panelist) => mapPanelistToListingRow(panelist));

    return {
      ...data,
      items,
      total,
      count: total,
      page: data.page ?? page,
      limit: data.limit ?? limit,
      totalPages:
        data.totalPages ?? Math.max(1, Math.ceil(total / (Number(limit) || 10)) || 1),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(error.message || LIST_LOAD_ERROR_MESSAGE, error.data, error.status, {
        sessionExpired: error.sessionExpired,
      });
    }
    throw new ApiError(LIST_LOAD_ERROR_MESSAGE, null);
  }
}

/** GET /api/panelist/:id — falls back to list lookup when detail endpoint is unavailable. */
export async function getRecord(id) {
  const normalizedId = normalizePanelistId(id);

  try {
    const data = await apiRequest(API_ROUTES.panelist.byId(normalizedId));
    assertSuccess(data, "Panelist not found.");

    const panelist = extractPanelistRecord(data);
    if (!panelist) {
      throw new ApiError("Panelist not found.", data);
    }

    return toPanelistDetailRecord(panelist);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const found = await findPanelistInList(id);
      if (found) {
        return found;
      }
    }

    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Panelist not found.", null);
  }
}

export async function getUserProfilingAnswers(userId, { page = 1, limit = 10, search } = {}) {
  const user = getCommunityUserById(userId);
  if (!user) {
    return { items: [], total: 0, count: 0, user: null };
  }

  const normalizedSearch = normalizeSearchQuery(search).toLowerCase();
  const answers = (user.profilingAnswers ?? []).filter((entry) => {
    if (!normalizedSearch) return true;
    return (
      String(entry.question ?? "").toLowerCase().includes(normalizedSearch) ||
      String(entry.answerOpted ?? "").toLowerCase().includes(normalizedSearch)
    );
  });

  const total = answers.length;
  const start = (page - 1) * limit;
  const items = answers.slice(start, start + limit).map((entry, index) => ({
    id: `${userId}-qa-${start + index + 1}`,
    question: entry.question,
    answerOpted: entry.answerOpted,
  }));

  return { items, total, count: total, user };
}

export async function getUserRewardLogs(
  userId,
  { page = 1, limit = 10, search, filters } = {}
) {
  const user = getCommunityUserById(userId);
  if (!user) {
    return { items: [], total: 0, count: 0, user: null };
  }

  const normalizedSearch = normalizeSearchQuery(search).toLowerCase();
  const logs = (user.rewardLogs ?? [])
    .map((entry, index) => normalizeRewardLogEntry(entry, index))
    .filter(Boolean)
    .filter((entry) => {
      if (filters?.reason && filters.reason !== "all" && entry.reason !== filters.reason) {
        return false;
      }
      if (filters?.pointsType === "credit" && entry.pointsValue <= 0) {
        return false;
      }
      if (filters?.pointsType === "debit" && entry.pointsValue >= 0) {
        return false;
      }
      if (!normalizedSearch) return true;
      return (
        String(entry.id ?? "").includes(normalizedSearch) ||
        String(entry.rewardPoints ?? "").toLowerCase().includes(normalizedSearch) ||
        String(entry.reason ?? "").toLowerCase().includes(normalizedSearch) ||
        String(entry.date ?? "").toLowerCase().includes(normalizedSearch)
      );
    });

  const total = logs.length;
  const start = (page - 1) * limit;
  const items = logs.slice(start, start + limit).map((entry) => ({
    id: entry.id,
    rewardPoints: entry.rewardPoints,
    reason: entry.reason,
    date: entry.date,
  }));

  return { items, total, count: total, user };
}

/** PUT /api/panelist/:id */
export async function updateRecord(id, payload) {
  const normalizedId = normalizePanelistId(id);
  const body = buildPanelistUpdatePayload(payload);

  if (!Object.keys(body).length) {
    throw new ApiError("No fields to update.", null);
  }

  const data = await apiRequest(API_ROUTES.panelist.byId(normalizedId), {
    method: "PUT",
    body,
  });

  return assertSuccess(data);
}

/** DELETE /api/panelist/:id */
export async function deleteRecord(id) {
  const normalizedId = normalizePanelistId(id);
  const data = await apiRequest(API_ROUTES.panelist.byId(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data);
}

export async function updateStatus(id, status) {
  const normalizedId = normalizePanelistId(id);
  const data = await apiRequest(API_ROUTES.panelist.updateStatus(normalizedId), {
    method: "PATCH",
    body: {
      status: formValueToApiStatus(status),
    },
  });

  return assertSuccess(data);
}

export async function resendEmail(id) {
  const user = getCommunityUserById(id);
  if (!user) {
    throw new Error("User not found.");
  }
  return { message: `Verification email resent to ${user.emailAddress}.` };
}

export { toListingRow } from "../data/communityUsersStore";
