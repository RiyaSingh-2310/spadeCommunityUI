/**
 * Lightweight JWT helpers for session keep-alive (expiry only — no signature verify).
 */

/** Treat the access token as expired this close to JWT `exp`. */
const EXPIRY_SKEW_MS = 5_000;

/** Values above this are unix milliseconds; JWT spec uses seconds. */
const EXP_MILLISECONDS_THRESHOLD = 1e12;

/**
 * @param {string} token
 * @returns {Record<string, unknown> | null}
 */
export function decodeJwtPayload(token) {
  const raw = String(token ?? "").trim();
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length < 2) return null;

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const json = atob(padded);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} token
 * @returns {number | null} expiry as epoch milliseconds
 */
export function getJwtExpiryMs(token) {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp) || exp <= 0) return null;
  // JWT NumericDate is seconds. Some issuers incorrectly send milliseconds.
  return exp > EXP_MILLISECONDS_THRESHOLD ? exp : exp * 1000;
}

/**
 * Milliseconds until JWT expiry. Negative if already expired.
 * @param {string} token
 * @returns {number | null}
 */
export function getJwtMsUntilExpiry(token) {
  const expiryMs = getJwtExpiryMs(token);
  if (expiryMs == null) return null;
  return expiryMs - Date.now();
}

/**
 * Whether a 401 should end the admin session.
 * A still-valid JWT must not be cleared just because one endpoint returned 401.
 *
 * @param {string | null | undefined} token
 * @returns {boolean}
 */
export function shouldInvalidateSessionOn401(token) {
  const raw = String(token ?? "").trim();
  if (!raw) return true;

  const msLeft = getJwtMsUntilExpiry(raw);
  if (msLeft == null) return true;
  return msLeft <= EXPIRY_SKEW_MS;
}
