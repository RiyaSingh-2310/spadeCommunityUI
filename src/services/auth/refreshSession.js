import axios from "axios";
import { API_ROUTES, buildApiUrl } from "../../config/api";
import {
  getAdminUser,
  getRefreshToken,
  saveAuthSession,
} from "./authStorage";
import { mapLoginResponse } from "./mapLoginResponse";

/** Single in-flight refresh so concurrent 401s share one exchange. */
let refreshInFlight = null;

/**
 * Exchange the stored refresh token for a new access token.
 *
 * TODO(backend): Confirm POST /api/admin/refresh-token contract:
 * - Request body: `{ refreshToken: string }`
 * - Success response: `{ success: true, data: { token, refreshToken? } }`
 *   (or top-level `token` / `refreshToken`, matching login shape)
 * - Invalid/expired refresh → 401
 *
 * Uses a standalone axios call (not apiRequest) to avoid 401 refresh recursion.
 *
 * @returns {Promise<boolean>} true when a new access token was saved
 */
export async function tryRefreshAuthSession() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await axios.request({
        url: buildApiUrl(API_ROUTES.admin.refreshToken),
        method: "POST",
        timeout: 30000,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        data: { refreshToken },
      });

      const mapped = mapLoginResponse(response.data);
      if (!mapped.success || !mapped.token) {
        return false;
      }

      saveAuthSession({
        token: mapped.token,
        refreshToken: mapped.refreshToken || refreshToken,
        admin: mapped.admin || getAdminUser(),
      });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
