/**
 * Password / secret fields are sent as plaintext over HTTPS/TLS.
 *
 * Browser-side encryption keys (VITE_ENCRYPTION_KEY*) are public in the Vite
 * bundle and are not secrets. This helper must never encrypt with client keys.
 *
 * Transport security is TLS. Authorization is enforced by the backend.
 */

/**
 * True when value already looks like legacy `${ivHex}:${ciphertext}` wire format.
 * @param {unknown} value
 */
export function isEncryptedValue(value) {
  if (typeof value !== "string" || !value.includes(":")) return false;
  const ivHex = value.slice(0, value.indexOf(":"));
  return /^[0-9a-f]{32}$/i.test(ivHex);
}

/**
 * Pass-through for password/API-secret fields. Does not encrypt and does not
 * use any frontend secret keys.
 *
 * @param {unknown} text
 * @returns {string}
 */
export function encryptValue(text) {
  if (text == null) return text;
  return String(text);
}

/** Alias for `encryptValue` — use either name across the app. */
export const encryptPayloadValue = encryptValue;
