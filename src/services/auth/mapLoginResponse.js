import { normalizeAdminUser } from "../../modules/shared/utils/userAvatar";

/**
 * Normalizes login API payloads (supports nested data, snake_case, alternate token keys).
 * @param {object | null | undefined} raw
 */
export function mapLoginResponse(raw) {
  if (!raw || typeof raw !== "object") {
    return { token: "", refreshToken: "", admin: null, message: "", success: false };
  }

  const nested =
    raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)
      ? raw.data
      : null;

  const source = nested ? { ...raw, ...nested } : raw;

  const token = String(
    source.token ??
      source.accessToken ??
      source.access_token ??
      source.jwt ??
      source.authToken ??
      ""
  ).trim();

  const refreshToken = String(
    source.refreshToken ?? source.refresh_token ?? ""
  ).trim();

  const adminSource =
    source.admin ??
    source.user ??
    source.adminUser ??
    source.admin_data ??
    {};

  const admin = normalizeAdminUser({
    ...(typeof adminSource === "object" ? adminSource : {}),
    email:
      adminSource?.email ??
      source.email ??
      source.user_email,
    firstName:
      adminSource?.firstName ??
      adminSource?.first_name ??
      source.firstName ??
      source.first_name,
    lastName:
      adminSource?.lastName ??
      adminSource?.last_name ??
      source.lastName ??
      source.last_name,
    imageUrl:
      adminSource?.imageUrl ??
      adminSource?.image_url ??
      source.imageUrl ??
      source.image_url,
    permissions:
      adminSource?.permissions ??
      source.permissions ??
      source.permissions_json,
    permission_type:
      adminSource?.permission_type ??
      adminSource?.permissionType ??
      source.permission_type ??
      source.permissionType,
    status: adminSource?.status ?? source.status,
  });

  const explicitSuccess = source.success;
  const success =
    explicitSuccess === true ||
    explicitSuccess === "true" ||
    (explicitSuccess !== false && Boolean(token));

  return {
    token,
    refreshToken,
    admin,
    message: source.message ?? "",
    success,
  };
}
