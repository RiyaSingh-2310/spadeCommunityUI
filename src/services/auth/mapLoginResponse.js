import { normalizeAdminUser } from "../../modules/shared/utils/userAvatar";

/**
 * API shape:
 * { success, message, data: { token, admin } }
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

  const adminSource = nested?.admin ?? raw.admin ?? null;
  const admin =
    adminSource && typeof adminSource === "object"
      ? normalizeAdminUser(adminSource)
      : null;

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
