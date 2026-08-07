import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import {
  getAuthToken,
  getAdminUser,
  saveAuthSession,
} from "../../../services/auth/authStorage";
import {
  getLoginRole,
  isManagerLoginRole,
  isSalesLoginRole,
} from "../../../services/auth/loginRole";
import { buildPermissionsPayload } from "../../permissions/permissionsUtils";
import { encryptValue } from "../../shared/utils/encryption";
import {
  extractAdminFromResponse,
  formStatusToApiStatus,
  mapAdminToForm,
  updateRecord,
} from "../../../services/users/usersApi";
import { normalizeAdminUser, resolveProfileImageUrl } from "../../shared/utils/userAvatar";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function resolveMeRoute() {
  if (isManagerLoginRole()) return API_ROUTES.projectManagers.me;
  if (isSalesLoginRole()) return API_ROUTES.salesManagers.me;
  return API_ROUTES.admin.me;
}

function resolveSelfUpdateRoute(userId) {
  const id = encodeURIComponent(String(userId ?? "").trim());
  if (isManagerLoginRole()) return API_ROUTES.projectManagers.update(id);
  if (isSalesLoginRole()) return API_ROUTES.salesManagers.update(id);
  return API_ROUTES.admin.update(id);
}

function extractSelfRecord(data) {
  const fromAdminShape = extractAdminFromResponse(data);
  if (fromAdminShape) return fromAdminShape;

  if (!data || typeof data !== "object") return null;
  const nested = data.data && typeof data.data === "object" ? data.data : null;
  if (nested && (nested.id != null || nested.email != null || nested.name != null)) {
    return nested;
  }
  return null;
}

function syncAuthSessionFromRecord(record) {
  if (!record) return;
  saveAuthSession({
    token: getAuthToken(),
    admin: normalizeAdminUser(record),
    loginRole: getLoginRole(),
  });
}

export function mapAdminToProfileForm(admin) {
  const mapped = mapAdminToForm(admin);
  return {
    name: mapped.name ?? "",
    email: mapped.email ?? "",
    phone: admin?.contact_no ?? admin?.contactNo ?? admin?.phone ?? "",
    status: mapped.status,
    permission_type: mapped.permission_type,
    permissions: mapped.permissions,
    imageUrl: resolveProfileImageUrl(admin) ?? "",
  };
}

/**
 * Loads the authenticated user's profile via role-specific `/me` endpoints.
 * Never uses another user's id for the email/profile source.
 */
export async function fetchProfile() {
  const data = await apiRequest(resolveMeRoute());
  assertSuccess(data);

  const admin = extractSelfRecord(data);
  if (!admin) {
    throw new ApiError(data?.message ?? "Profile not found.", data);
  }

  syncAuthSessionFromRecord(admin);

  return {
    admin,
    profile: null,
    form: mapAdminToProfileForm(admin),
  };
}

/**
 * Updates the logged-in user's profile. Always includes their own email from
 * the payload (never a hardcoded or third-party email).
 */
export async function updateProfile(userId, payload) {
  const {
    name,
    email,
    status,
    permission_type,
    permissions,
    imageFile,
  } = payload;

  const sessionUser = getAdminUser();
  const resolvedEmail = String(
    email ?? sessionUser?.email ?? ""
  ).trim();
  const resolvedId = String(userId ?? sessionUser?.id ?? "").trim();

  if (!resolvedId) {
    throw new ApiError("Unable to update profile: missing user id.");
  }

  if (isManagerLoginRole() || isSalesLoginRole()) {
    const body = new FormData();
    body.append("name", String(name ?? "").trim());
    body.append("email", resolvedEmail);
    body.append("status", formStatusToApiStatus(status));
    if (imageFile instanceof File) {
      body.append("profile_image", imageFile);
    }

    const data = await apiRequest(resolveSelfUpdateRoute(resolvedId), {
      method: "PUT",
      body,
    });
    assertSuccess(data);

    const refreshed = await fetchProfile(resolvedId);
    return { ...data, admin: refreshed.admin };
  }

  if (imageFile instanceof File) {
    const body = new FormData();
    body.append("name", String(name ?? "").trim());
    if (resolvedEmail) body.append("email", resolvedEmail);
    body.append("permission_type", permission_type ?? "user");
    body.append("status", formStatusToApiStatus(status));
    body.append(
      "permissions",
      JSON.stringify(buildPermissionsPayload(permissions).permissions)
    );
    body.append("image", imageFile);

    const data = await apiRequest(API_ROUTES.admin.update(resolvedId), {
      method: "PUT",
      body,
    });
    assertSuccess(data);

    const admin = extractAdminFromResponse(data);
    if (admin) syncAuthSessionFromRecord(admin);

    return data;
  }

  const data = await updateRecord(resolvedId, {
    name,
    status,
    permission_type,
    permissions,
  });

  const admin = extractAdminFromResponse(data);
  if (admin) syncAuthSessionFromRecord(admin);

  return data;
}

/**
 * Encrypts password fields before send.
 * newPassword and confirmPassword use the same ciphertext so backend
 * equality validation passes (AES IV is random per encrypt call).
 */
export async function changePassword(payload) {
  const plainCurrent = String(payload.currentPassword ?? "");
  const plainNew = String(payload.newPassword ?? "");
  const plainConfirm = String(payload.confirmPassword ?? "");

  const encryptedCurrent = encryptValue(plainCurrent);
  const encryptedNew = encryptValue(plainNew);
  // Reuse the same ciphertext so validator `confirm === new` succeeds.
  const encryptedConfirm =
    plainConfirm === plainNew ? encryptedNew : encryptValue(plainConfirm);

  if (isManagerLoginRole() || isSalesLoginRole()) {
    const sessionUser = getAdminUser();
    const userId = String(sessionUser?.id ?? "").trim();
    const email = String(sessionUser?.email ?? "").trim();
    const name = String(sessionUser?.name ?? sessionUser?.displayName ?? "").trim();

    if (!userId) {
      throw new ApiError("Unable to update password: missing user id.");
    }

    const data = await apiRequest(resolveSelfUpdateRoute(userId), {
      method: "PUT",
      body: {
        name,
        email,
        new_password: encryptedNew,
      },
    });

    return assertSuccess(data);
  }

  const data = await apiRequest(API_ROUTES.admin.changePassword, {
    method: "PUT",
    body: {
      currentPassword: encryptedCurrent,
      newPassword: encryptedNew,
      confirmPassword: encryptedConfirm,
    },
  });

  return assertSuccess(data);
}
