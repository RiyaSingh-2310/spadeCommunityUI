import { API_ROUTES } from "../../config/api";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import { formatStatusLabel } from "../../modules/shared/utils/statusLabels";
import {
  getUserDisplayName,
  normalizeAdminUser,
  resolveProfileImageUrl,
  splitFullName,
} from "../../modules/shared/utils/userAvatar";
import { getAuthToken, saveAuthSession } from "../auth/authStorage";
import { getLoginRole, LOGIN_ROLES } from "../auth/loginRole";

function assertSuccess(data, fallbackMessage) {
  if (data?.success === false) {
    throw new ApiError(data?.message || fallbackMessage, data);
  }
  return data;
}

function unwrapRecord(data) {
  if (data?.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  return data && typeof data === "object" ? data : null;
}

/**
 * Maps GET /api/panelist-portal/dashboard (and profile) response data into UI fields.
 * @param {object | null | undefined} record
 */
export function mapPanelistDashboard(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const name = String(record.name ?? "").trim();
  const { firstName, lastName } = splitFullName(name);
  const balanceRaw = record.balance_point ?? record.balancePoint ?? 0;
  const balanceNumber = Number(balanceRaw);
  const questionnaireRaw = String(record.questionnaire ?? "")
    .trim()
    .toLowerCase();

  return {
    id: record.id ?? null,
    name,
    firstName,
    lastName,
    displayName: getUserDisplayName(firstName, lastName, name),
    email: String(record.email ?? "").trim(),
    phone: record.phone != null && String(record.phone).trim()
      ? String(record.phone).trim()
      : "",
    photo: resolveProfileImageUrl(record) ?? null,
    balancePoint: Number.isFinite(balanceNumber) ? balanceNumber : 0,
    balancePointLabel: Number.isFinite(balanceNumber)
      ? balanceNumber.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : String(balanceRaw),
    status: String(record.status ?? "").trim(),
    statusLabel: formatStatusLabel(record.status),
    questionnaireCompleted:
      questionnaireRaw === "yes" ||
      questionnaireRaw === "true" ||
      questionnaireRaw === "1" ||
      questionnaireRaw === "completed",
    questionnaireLabel:
      questionnaireRaw === "yes" ||
      questionnaireRaw === "true" ||
      questionnaireRaw === "1" ||
      questionnaireRaw === "completed"
        ? "Completed"
        : questionnaireRaw === "no" ||
            questionnaireRaw === "false" ||
            questionnaireRaw === "0"
          ? "Pending"
          : String(record.questionnaire ?? "").trim() || "—",
    memberSince:
      record.member_since ?? record.memberSince ?? record.created_at ?? null,
  };
}

/**
 * Maps a panelist portal profile record into the shared settings profile form shape.
 * @param {object | null | undefined} record
 */
export function mapPanelistToProfileForm(record) {
  const mapped = mapPanelistDashboard(record);
  if (!mapped) {
    return {
      name: "",
      email: "",
      phone: "",
      status: "Active",
      permission_type: "user",
      permissions: {},
      imageUrl: "",
    };
  }

  return {
    name: mapped.displayName || mapped.name,
    email: mapped.email,
    phone: mapped.phone,
    status: mapped.statusLabel || "Active",
    permission_type: "user",
    permissions: {},
    imageUrl: mapped.photo ?? "",
  };
}

function syncPanelistSessionFromRecord(record) {
  if (!record || typeof record !== "object") return;
  const mapped = mapPanelistDashboard(record);
  if (!mapped) return;

  saveAuthSession({
    token: getAuthToken(),
    admin: normalizeAdminUser({
      id: mapped.id,
      name: mapped.name,
      email: mapped.email,
      phone: mapped.phone,
      photo: mapped.photo,
      status: mapped.status,
    }),
    loginRole: getLoginRole() || LOGIN_ROLES.PANELIST,
  });
}

/**
 * GET /api/panelist-portal/dashboard
 */
export async function fetchPanelistDashboard() {
  const data = await apiRequest(API_ROUTES.panelistPortal.dashboard, {
    method: "GET",
    auth: true,
  });

  assertSuccess(data, "Failed to load panelist dashboard.");

  const mapped = mapPanelistDashboard(unwrapRecord(data));
  if (!mapped) {
    throw new ApiError("Panelist dashboard data is unavailable.", data);
  }

  return mapped;
}

/**
 * GET /api/panelist-portal/profile
 */
export async function fetchPanelistProfile() {
  const data = await apiRequest(API_ROUTES.panelistPortal.profile, {
    method: "GET",
    auth: true,
  });

  assertSuccess(data, "Failed to load panelist profile.");
  const record = unwrapRecord(data);
  if (!record) {
    throw new ApiError("Panelist profile is unavailable.", data);
  }

  return {
    panelist: record,
    form: mapPanelistToProfileForm(record),
  };
}

/**
 * PUT /api/panelist-portal/profile
 * Accepts JSON or multipart FormData when uploading a photo.
 * @param {{ name?: string, phone?: string, imageFile?: File | null }} payload
 */
export async function updatePanelistProfile(payload) {
  const { name, phone, imageFile } = payload ?? {};
  let body;

  if (imageFile instanceof File) {
    body = new FormData();
    if (name !== undefined) body.append("name", String(name ?? "").trim());
    if (phone !== undefined) body.append("phone", String(phone ?? "").trim());
    body.append("photo", imageFile);
  } else {
    body = {};
    if (name !== undefined) body.name = String(name ?? "").trim();
    if (phone !== undefined) body.phone = String(phone ?? "").trim();
  }

  const data = await apiRequest(API_ROUTES.panelistPortal.profile, {
    method: "PUT",
    auth: true,
    body,
  });

  assertSuccess(data, "Failed to update panelist profile.");

  // Refresh profile so session avatar/name stay in sync.
  try {
    const refreshed = await fetchPanelistProfile();
    syncPanelistSessionFromRecord(refreshed.panelist);
  } catch {
    // Profile update succeeded; session refresh is best-effort.
  }

  return data;
}

/**
 * PUT /api/panelist-portal/change-password
 * Backend expects: old_password, new_password, confirm_password
 * @param {{ currentPassword: string, newPassword: string, confirmPassword: string }} payload
 */
export async function changePanelistPassword(payload) {
  const data = await apiRequest(API_ROUTES.panelistPortal.changePassword, {
    method: "PUT",
    auth: true,
    body: {
      old_password: String(payload.currentPassword ?? ""),
      new_password: String(payload.newPassword ?? ""),
      confirm_password: String(payload.confirmPassword ?? ""),
    },
  });

  return assertSuccess(data, "Failed to change password.");
}
