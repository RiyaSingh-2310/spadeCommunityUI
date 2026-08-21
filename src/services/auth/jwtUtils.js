/**
 * Lightweight JWT helpers for session keep-alive (expiry only — no signature verify).
 */

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
  return exp * 1000;
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
