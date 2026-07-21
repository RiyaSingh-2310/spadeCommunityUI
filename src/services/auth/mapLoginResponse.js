import { prepareAdminSessionUser } from "../../modules/permissions/permissionsUtils";
import { normalizeAdminUser } from "../../modules/shared/utils/userAvatar";

/**
 * True when `value` looks like a logged-in user record (not a token wrapper).
 * Sales Manager login returns: { token, data: { id, code, name, email, image_url } }
 */
function looksLikeSessionUser(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if ("token" in value && ("admin" in value || "salesManager" in value || "projectManager" in value)) {
    return false;
  }
  return (
    "id" in value ||
    "email" in value ||
    "name" in value ||
    "code" in value ||
    "firstName" in value ||
    "first_name" in value
  );
}

/**
 * API shapes:
 * Admin:          { success, message, data: { token, admin, permissions? } }
 * Sales Manager:  { success, message, token, data: { id, code, name, email, image_url } }
 *
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

  const token = String(
    nested?.token ??
      nested?.accessToken ??
      nested?.access_token ??
      raw.token ??
      raw.accessToken ??
      ""
  ).trim();

  const refreshToken = String(
    nested?.refreshToken ?? nested?.refresh_token ?? raw.refreshToken ?? ""
  ).trim();

  const adminSource =
    nested?.admin ??
    nested?.salesManager ??
    nested?.projectManager ??
    nested?.manager ??
    nested?.user ??
    raw.admin ??
    raw.salesManager ??
    raw.projectManager ??
    raw.user ??
    (looksLikeSessionUser(nested) ? nested : null) ??
    null;
  const sessionAdmin =
    adminSource && typeof adminSource === "object"
      ? prepareAdminSessionUser(adminSource, nested, raw)
      : null;
  const admin = sessionAdmin ? normalizeAdminUser(sessionAdmin) : null;

  const success =
    raw.success === true ||
    raw.success === "true" ||
    raw.success === 1 ||
    (raw.success !== false && Boolean(token));

  return {
    token,
    refreshToken,
    admin,
    message: String(raw.message ?? "").trim(),
    success,
  };
}
