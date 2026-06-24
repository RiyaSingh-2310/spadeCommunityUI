import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { getAuthToken, saveAuthSession } from "../../../services/auth/authStorage";
import { buildPermissionsPayload } from "../../permissions/permissionsUtils";
import {
  extractAdminFromResponse,
  formStatusToApiStatus,
  getRecord,
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

export async function fetchProfile(userId) {
  const admin = await getRecord(userId);
  return {
    admin,
    form: mapAdminToProfileForm(admin),
  };
}

export async function updateProfile(userId, payload) {
  const { name, status, permission_type, permissions, imageFile } = payload;

  if (imageFile instanceof File) {
    const body = new FormData();
    body.append("name", String(name ?? "").trim());
    body.append("permission_type", permission_type ?? "user");
    body.append("status", formStatusToApiStatus(status));
    body.append(
      "permissions",
      JSON.stringify(buildPermissionsPayload(permissions).permissions)
    );
    body.append("image", imageFile);

    const data = await apiRequest(API_ROUTES.admin.update(userId), {
      method: "PUT",
      body,
    });
    assertSuccess(data);

    const admin = extractAdminFromResponse(data);
    if (admin) {
      saveAuthSession({
        token: getAuthToken(),
        admin: normalizeAdminUser(admin),
      });
    }

    return data;
  }

  const data = await updateRecord(userId, {
    name,
    status,
    permission_type,
    permissions,
  });

  const admin = extractAdminFromResponse(data);
  if (admin) {
    saveAuthSession({
      token: getAuthToken(),
      admin: normalizeAdminUser(admin),
    });
  }

  return data;
}

export async function changePassword(payload) {
  const data = await apiRequest(API_ROUTES.admin.changePassword, {
    method: "PUT",
    body: {
      currentPassword: String(payload.currentPassword ?? ""),
      newPassword: String(payload.newPassword ?? ""),
      confirmPassword: String(payload.confirmPassword ?? ""),
    },
  });

  return assertSuccess(data);
}
