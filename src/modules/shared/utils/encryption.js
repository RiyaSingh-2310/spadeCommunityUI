import CryptoJS from "crypto-js";

/**
 * Client-side AES "encryption" matching backend `utils/cryptoHelper.js`.
 * Format: `${ivHex}:${ciphertext}` (double AES-CBC with KEY1 then KEY2).
 *
 * SECURITY NOTE (C3):
 * VITE_ENCRYPTION_KEY1/2 are bundled into public JS by Vite — anyone can
 * read them from the deployed app. This is NOT confidentiality; it only
 * matches a legacy backend contract. Real transport security is HTTPS/TLS.
 *
 * TODO(backend): Accept plaintext passwords over TLS and remove this scheme.
 * Until then, keep encrypting so login/reset continue to work.
 *
 * L1 — IV reuse: both AES passes currently share one IV (backend decrypt
 * expects a single IV in the wire format). Using distinct IVs requires a
 * coordinated backend format change (e.g. `iv1:iv2:ciphertext`).
 */

const ENCRYPTION_KEY1_HEX =
  import.meta.env.VITE_ENCRYPTION_KEY1?.trim() ?? "";
const ENCRYPTION_KEY2_HEX =
  import.meta.env.VITE_ENCRYPTION_KEY2?.trim() ?? "";

const ENCRYPTION_KEY1 = ENCRYPTION_KEY1_HEX
  ? CryptoJS.enc.Hex.parse(ENCRYPTION_KEY1_HEX)
  : null;
const ENCRYPTION_KEY2 = ENCRYPTION_KEY2_HEX
  ? CryptoJS.enc.Hex.parse(ENCRYPTION_KEY2_HEX)
  : null;

const AES_OPTIONS = {
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7,
};

/**
 * True when value already looks like ciphertext produced by `encryptValue`
 * (`32-char-hex-iv:base64...`).
 * @param {unknown} value
 */
export function isEncryptedValue(value) {
  if (typeof value !== "string" || !value.includes(":")) return false;
  const ivHex = value.slice(0, value.indexOf(":"));
  return /^[0-9a-f]{32}$/i.test(ivHex);
}

/**
 * Encrypts a sensitive string for API payloads (password, API secret key).
 * Returns empty/nullish input unchanged. Skips values that are already encrypted.
 *
 * @param {unknown} text
 * @returns {string}
 */
export function encryptValue(text) {
  if (text == null) return text;
  const value = String(text);
  if (!value) return value;
  if (isEncryptedValue(value)) return value;

  if (!ENCRYPTION_KEY1 || !ENCRYPTION_KEY2) {
    throw new Error(
      "VITE_ENCRYPTION_KEY1 and VITE_ENCRYPTION_KEY2 must be set in the environment."
    );
  }

  // Shared IV required by current backend wire format (see L1 note above).
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted1 = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY1, {
    iv,
    ...AES_OPTIONS,
  });
  const encrypted2 = CryptoJS.AES.encrypt(encrypted1.toString(), ENCRYPTION_KEY2, {
    iv,
    ...AES_OPTIONS,
  });

  return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted2.toString()}`;
}

/** Alias for `encryptValue` — use either name across the app. */
export const encryptPayloadValue = encryptValue;
