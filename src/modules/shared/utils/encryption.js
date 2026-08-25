import CryptoJS from "crypto-js";

/**
 * Client-side AES matching backend `utils/cryptoHelper.js`.
 * Wire format: `${ivHex}:${ciphertext}` (AES-CBC with KEY1, then KEY2, shared IV).
 *
 * These keys must match the backend ENCRYPTION_KEY1 / ENCRYPTION_KEY2 values.
 * They are protocol obfuscation keys for the existing login contract, not
 * transport secrets — TLS provides confidentiality. They are not read from
 * VITE_* so they are not treated as environment secrets.
 */

const ENCRYPTION_KEY1 = CryptoJS.enc.Hex.parse(
  "fbccfa2e05dec20ef56ab55c34c70c3b487971643d3241626b5fff8a02d1c1a8"
);
const ENCRYPTION_KEY2 = CryptoJS.enc.Hex.parse(
  "5b339cbc4fc60f67ff8ed4f5eb3c07e73850656dde226be582530e2df7dc030b"
);

const AES_OPTIONS = {
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7,
};

/**
 * True when value already looks like `${ivHex}:${ciphertext}` wire format.
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
