import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { downloadCsvExport, buildDatedExportFilename } from "../../../services/api/csvExport";
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
import { formatAppDateValue } from "../../shared/utils/dateTime";
import { parsePhoneValue } from "../../shared/utils/phoneValidation";
import { encryptValue } from "../../shared/utils/encryption";
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

function formValueFromDisplay(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "—") return "";
  return text;
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (value == null || typeof value === "object") continue;
    const text = formValueFromDisplay(value);
    if (text) return text;
  }
  return "";
}

function resolvePanelistPhone(panelist) {
  const nested =
    panelist?.user && typeof panelist.user === "object" ? panelist.user : null;
  const profile =
    panelist?.profile && typeof panelist.profile === "object"
      ? panelist.profile
      : null;

  return firstNonEmptyString(
    panelist?.phone,
    panelist?.phone_number,
    panelist?.phoneNumber,
    panelist?.mobileNumber,
    panelist?.mobile_number,
    panelist?.mobile,
    panelist?.contact_no,
    panelist?.contactNumber,
    nested?.phone,
    nested?.mobileNumber,
    nested?.mobile,
    nested?.contact_no,
    profile?.phone,
    profile?.mobileNumber,
    profile?.mobile
  );
}

const PANELIST_PROFILE_IMAGE_KEYS = [
  "photo",
  "image",
  "profile_image",
  "profileImage",
  "image_url",
  "imageUrl",
  "avatar",
  "photo_url",
  "photoUrl",
];

/**
 * True when the backend record includes a profile-image field or existing image data.
 */
export function panelistProvidesProfileImage(panelist) {
  if (!panelist || typeof panelist !== "object") return false;

  const hasImageField = PANELIST_PROFILE_IMAGE_KEYS.some((key) =>
    Object.prototype.hasOwnProperty.call(panelist, key)
  );
  if (hasImageField) return true;

  const existing = String(
    panelist.photo ??
      panelist.image ??
      panelist.profile_image ??
      panelist.profileImage ??
      ""
  ).trim();
  return Boolean(existing) && existing !== "—";
}

/** Maps panelist API record to edit form values. */
export function mapPanelistToForm(panelist) {
  return {
    name: formValueFromDisplay(panelist?.name),
    email: formValueFromDisplay(panelist?.email ?? panelist?.emailAddress),
    mobileNumber: parsePhoneValue(resolvePanelistPhone(panelist), "IN").nationalNumber.slice(
      0,
      10
    ),
    status: apiStatusToFormValue(panelist?.status),
    supportsProfileImage:
      typeof panelist?.supportsProfileImage === "boolean"
        ? panelist.supportsProfileImage
        : panelistProvidesProfileImage(panelist),
  };
}

function buildPanelistUpdatePayload(payload) {
  const body = {};

  if (payload.name != null) {
    body.name = String(payload.name).trim();
  }
  if (payload.phone != null || payload.mobileNumber != null) {
    body.phone = String(payload.phone ?? payload.mobileNumber ?? "").trim();
  }
  if (payload.status != null) {
    body.status = formValueToApiStatus(payload.status);
  }

  const password = String(payload.password ?? "").trim();
  if (password) {
    body.new_password = encryptValue(password);
  }

  return body;
}

function buildPanelistUpdateFormData(payload) {
  const body = new FormData();
  const jsonFields = buildPanelistUpdatePayload(payload);

  Object.entries(jsonFields).forEach(([key, value]) => {
    if (value != null) {
      body.append(key, String(value));
    }
  });

  // Panelist GET responses expose `photo` (with `image` as a fallback alias).
  // Multipart upload uses the same primary field name as the sibling admin
  // FormData pattern in usersApi.js, but mapped to panelist terminology.
  if (payload.imageFile instanceof File) {
    body.append("photo", payload.imageFile);
  }

  return body;
}

/** Maps GET /api/panelist/list record to listing row shape. */
export function mapPanelistToListingRow(panelist) {
  const phone = resolvePanelistPhone(panelist);

  return {
    id: panelist?.id,
    name: panelist?.name ?? "",
    emailAddress: panelist?.email ?? panelist?.emailAddress ?? "",
    mobileNumber: phone !== "" ? phone : "—",
    phone: phone !== "" ? phone : "—",
    status: apiStatusToFormValue(panelist?.status),
    prescreenCompleted: mapYesNoFromApi(panelist?.questionnaire),
    emailVerified: mapIsVerified(panelist?.is_verified ?? panelist?.isVerified),
    rewardPoints: panelist?.balance_point ?? panelist?.balancePoint ?? "—",
    joiningDate: formatAppDateValue(panelist?.created_at ?? panelist?.createdAt),
    ipAddress: panelist?.ip_address ?? panelist?.ipAddress ?? "—",
    createdAt: formatAppDateValue(panelist?.created_at ?? panelist?.createdAt),
    photo: panelist?.photo ?? panelist?.image ?? null,
  };
}

function displayOrDash(value) {
  if (value == null) return "—";
  const text = String(value).trim();
  return text !== "" ? text : "—";
}

/** Maps GET /api/panelist/:id `questionnaire_answers` rows to profiling table rows. */
function mapQuestionnaireAnswers(answers) {
  if (!Array.isArray(answers)) return [];

  return answers
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;

      // Prefer question_text (e.g. "What is your car color?") over grouping title.
      const question = String(
        entry.question_text ??
          entry.questionText ??
          entry.question ??
          entry.question_title ??
          entry.questionTitle ??
          "",
      ).trim();
      const answerOpted = String(
        entry.answer ?? entry.answerOpted ?? entry.answer_opted ?? "",
      ).trim();

      return {
        id: entry.id ?? `${entry.question_id ?? "qa"}-${index + 1}`,
        question: question || "—",
        answerOpted: answerOpted || "—",
      };
    })
    .filter(Boolean);
}

/**
 * Maps GET /api/panelist/:id `data` object to the details page record.
 * API shape: { id, name, email, phone, photo, is_verified, balance_point,
 *   status, created_at, updated_at, questionnaire, questionnaire_url,
 *   questionnaire_answers, ... }
 */
function toPanelistDetailRecord(panelist) {
  const listing = mapPanelistToListingRow(panelist);
  const form = mapPanelistToForm({
    ...panelist,
    supportsProfileImage: panelistProvidesProfileImage(panelist),
  });
  const phone = form.mobileNumber;
  const balancePoint = panelist?.balance_point ?? panelist?.balancePoint ?? "";
  const createdAt = panelist?.created_at ?? panelist?.createdAt ?? "";
  const updatedAt = panelist?.updated_at ?? panelist?.updatedAt ?? "";
  const questionnaireUrl =
    panelist?.questionnaire_url ?? panelist?.questionnaireUrl ?? "";
  const photo = panelist?.photo ?? panelist?.image ?? null;
  const profilingAnswers = mapQuestionnaireAnswers(
    panelist?.questionnaire_answers ?? panelist?.questionnaireAnswers,
  );

  return {
    ...listing,
    ...form,
    id: panelist?.id ?? listing.id,
    name: String(panelist?.name ?? form.name ?? "").trim(),
    email: panelist?.email ?? panelist?.emailAddress ?? form.email ?? "",
    emailAddress: panelist?.email ?? panelist?.emailAddress ?? listing.emailAddress ?? "",
    phone: displayOrDash(phone),
    mobileNumber: phone,
    photo,
    isVerified: mapIsVerified(panelist?.is_verified ?? panelist?.isVerified),
    emailVerified: mapIsVerified(panelist?.is_verified ?? panelist?.isVerified),
    balancePoint: displayOrDash(balancePoint),
    rewardPoints: displayOrDash(balancePoint),
    questionnaire: mapYesNoFromApi(panelist?.questionnaire),
    prescreenCompleted: mapYesNoFromApi(panelist?.questionnaire),
    questionnaireUrl: displayOrDash(questionnaireUrl),
    profilingAnswers,
    status: apiStatusToFormValue(panelist?.status),
    createdAt,
    updatedAt,
    joiningDate: formatAppDateValue(createdAt),
    updatedDate: formatAppDateValue(updatedAt),
    deletedAt: panelist?.deleted_at ?? panelist?.deletedAt ?? null,
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

export async function getUserProfilingAnswers(
  userId,
  { page = 1, limit = 10, search, answers } = {},
) {
  let user = null;
  let profilingAnswers = Array.isArray(answers) ? answers : null;

  if (!profilingAnswers) {
    try {
      user = await getRecord(userId);
      profilingAnswers = user?.profilingAnswers ?? [];
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { items: [], total: 0, count: 0, user: null };
      }
      throw error;
    }
  }

  if (!Array.isArray(profilingAnswers)) {
    return { items: [], total: 0, count: 0, user };
  }

  const normalizedSearch = normalizeSearchQuery(search).toLowerCase();
  const filtered = profilingAnswers.filter((entry) => {
    if (!normalizedSearch) return true;
    return (
      String(entry.question ?? "").toLowerCase().includes(normalizedSearch) ||
      String(entry.answerOpted ?? "").toLowerCase().includes(normalizedSearch)
    );
  });

  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit).map((entry, index) => ({
    id: entry.id ?? `${userId}-qa-${start + index + 1}`,
    question: entry.question,
    answerOpted: entry.answerOpted,
  }));

  return { items, total, count: total, user };
}

export async function getUserRewardLogs(
  userId,
  { page = 1, limit = 10, search, filters } = {}
) {
  const normalizedId = normalizePanelistId(userId);
  const path = appendListQuery(API_ROUTES.rewardHistory.list, {
    page,
    limit,
    search,
    extra: {
      user_id: String(userId ?? "").trim(),
      panelist_id: String(userId ?? "").trim(),
    },
  });
  const data = await apiRequest(path);
  assertSuccess(data);

  const rawItems = Array.isArray(data?.data) ? data.data : [];
  const hasUserKeys = rawItems.some(
    (item) =>
      item?.user_id != null ||
      item?.userId != null ||
      item?.panelist_id != null ||
      item?.panelistId != null
  );
  const scopedItems = hasUserKeys
    ? rawItems.filter((item) => {
        const candidates = [
          item?.user_id,
          item?.userId,
          item?.panelist_id,
          item?.panelistId,
          item?.user?.id,
          item?.panelist?.id,
        ];
        return candidates.some(
          (value) => value != null && String(value) === String(userId)
        );
      })
    : rawItems;

  const logs = scopedItems
    .map((entry, index) =>
      normalizeRewardLogEntry(
        {
          id: entry?.id ?? `${normalizedId}-${index + 1}`,
          rewardPoints:
            entry?.reward_points ??
            entry?.rewardPoints ??
            entry?.points ??
            0,
          reason:
            entry?.reward_type ??
            entry?.rewardType ??
            entry?.remark ??
            entry?.transaction_type ??
            entry?.reason ??
            "—",
          date: formatAppDateValue(
            entry?.created_at ?? entry?.createdAt ?? entry?.date ?? ""
          ),
        },
        index
      )
    )
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
      return true;
    });

  const total = Number(data?.total);
  const resolvedTotal = Number.isFinite(total) && !hasUserKeys ? total : logs.length;
  const start = hasUserKeys ? (page - 1) * limit : 0;
  const pageItems = hasUserKeys ? logs.slice(start, start + limit) : logs;

  return {
    items: pageItems.map((entry) => ({
      id: entry.id,
      rewardPoints: entry.rewardPoints,
      reason: entry.reason,
      date: entry.date,
    })),
    total: resolvedTotal,
    count: resolvedTotal,
  };
}

/** PUT /api/panelist/:id */
export async function updateRecord(id, payload) {
  const normalizedId = normalizePanelistId(id);
  const hasImage = payload?.imageFile instanceof File;

  if (hasImage) {
    const data = await apiRequest(API_ROUTES.panelist.byId(normalizedId), {
      method: "PUT",
      body: buildPanelistUpdateFormData(payload),
    });
    return assertSuccess(data);
  }

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

/** POST /api/panelist/:id/resend-invite */
export async function resendEmail(id) {
  const normalizedId = normalizePanelistId(id);
  const data = await apiRequest(API_ROUTES.panelist.resendInvite(normalizedId), {
    method: "POST",
  });

  return assertSuccess(data);
}

const SIGNUP_LOAD_ERROR = "Unable to load signup details.";
const LOGIN_LOAD_ERROR = "Unable to load login details.";

function isEmptySignupRecord(record) {
  if (!record || typeof record !== "object") return true;
  if ("signup_detail_id" in record || "signupDetailId" in record) {
    const signupId = record.signup_detail_id ?? record.signupDetailId;
    return signupId == null || String(signupId).trim() === "";
  }
  return false;
}

function extractLoginPayload(data) {
  const nested = data?.data && typeof data.data === "object" && !Array.isArray(data.data)
    ? data.data
    : data;
  const records = Array.isArray(nested?.login_details)
    ? nested.login_details
    : Array.isArray(nested?.loginDetails)
      ? nested.loginDetails
      : Array.isArray(data?.data)
        ? data.data
        : [];
  const pagination = nested?.pagination && typeof nested.pagination === "object"
    ? nested.pagination
    : data?.pagination && typeof data.pagination === "object"
      ? data.pagination
      : {};
  return { records, pagination };
}

/** GET /api/panelist/:id/signup-details */
export async function getPanelistSignupDetails(id) {
  const normalizedId = normalizePanelistId(id);
  try {
    const data = await apiRequest(API_ROUTES.panelist.signupDetails(normalizedId));
    assertSuccess(data, SIGNUP_LOAD_ERROR);
    const record = extractPanelistRecord(data);
    if (!record || isEmptySignupRecord(record)) return null;
    return record;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw new ApiError(SIGNUP_LOAD_ERROR, null, error?.status);
  }
}

/** GET /api/panelist/:id/login-details?page=&limit= */
export async function getPanelistLoginDetails(id, { page = 1, limit = 20 } = {}) {
  const normalizedId = normalizePanelistId(id);
  const path = appendListQuery(API_ROUTES.panelist.loginDetails(normalizedId), {
    page,
    limit,
  });

  try {
    const data = await apiRequest(path);
    assertSuccess(data, LOGIN_LOAD_ERROR);
    const { records, pagination } = extractLoginPayload(data);
    const items = records.filter((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const entryId = entry.id ?? entry.login_detail_id ?? entry.loginDetailId;
      return entryId != null && String(entryId).trim() !== "";
    });
    const total = Number(pagination.total ?? pagination.totalRecords ?? items.length);
    const safeLimit = Number(pagination.limit ?? limit) || limit;
    const totalPages = Number(pagination.totalPages) || Math.max(1, Math.ceil((Number.isFinite(total) ? total : 0) / safeLimit) || 1);

    return {
      items,
      page: Number(pagination.page ?? page) || page,
      limit: safeLimit,
      total: Number.isFinite(total) ? total : items.length,
      totalPages,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { items: [], page, limit, total: 0, totalPages: 1 };
    }
    throw new ApiError(LOGIN_LOAD_ERROR, null, error?.status);
  }
}

/** POST /api/panelist/bulk-invite */
export async function bulkResendInvite(ids) {
  const normalizedIds = (Array.isArray(ids) ? ids : [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (normalizedIds.length === 0) {
    throw new ApiError("No panelist ids provided.", null);
  }

  const data = await apiRequest(API_ROUTES.panelist.bulkInvite, {
    method: "POST",
    body: { ids: normalizedIds },
  });

  return assertSuccess(data);
}

/**
 * GET /api/panelist/export — panelist CSV as returned by the backend
 * (ID, Name, Email address, Created at, Status).
 */
export async function exportPanelistsCsv() {
  return downloadCsvExport(API_ROUTES.panelist.exportCsv, {
    defaultFilename: buildDatedExportFilename("panelists-export"),
  });
}