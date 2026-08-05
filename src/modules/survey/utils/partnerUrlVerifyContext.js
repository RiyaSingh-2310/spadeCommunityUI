/**
 * Partner URL email-verification handoff.
 *
 * Root cause of the modal-not-opening bug:
 * `sessionStorage` is per-tab. Opening with `window.open(..., "noopener")`
 * creates a tab that cannot read context stashed by Partner Mapping.
 *
 * Fix: pass verify intent via URL query params (visible to the new tab),
 * and store the verified flag in `localStorage` (shared across tabs).
 */

export const PARTNER_VERIFY_QUERY_KEY = "partnerVerify";
export const PARTNER_MAPPING_ID_QUERY_KEY = "mappingId";

const VERIFIED_PREFIX = "partnerUrlOtpVerified:";
const RETURN_PATH_PREFIX = "partnerUrlVerifyReturn:";

function extractDoSurveyTokenFromUrl(partnerUrl) {
  const raw = String(partnerUrl ?? "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(
      raw,
      typeof window !== "undefined" ? window.location.origin : "https://local"
    );
    const match = parsed.pathname.match(/\/dosurvey\/([^/]+)\/?/i);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  } catch {
    const match = raw.match(/\/dosurvey\/([^/?#]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  }
}

export function getPartnerUrlOtpSessionKey(mappingId) {
  return mappingId ? `${VERIFIED_PREFIX}${String(mappingId)}` : "";
}

export function isPartnerUrlOtpVerified(mappingId) {
  if (typeof localStorage === "undefined") return false;
  const key = getPartnerUrlOtpSessionKey(mappingId);
  if (!key) return false;
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function markPartnerUrlOtpVerified(mappingId) {
  if (typeof localStorage === "undefined") return;
  const key = getPartnerUrlOtpSessionKey(mappingId);
  if (!key) return;
  try {
    localStorage.setItem(key, "1");
  } catch {
    // ignore quota / private mode
  }
}

export function stashPartnerUrlReturnPath(mappingId, returnPath) {
  if (typeof localStorage === "undefined") return;
  const id = String(mappingId ?? "").trim();
  if (!id) return;
  try {
    localStorage.setItem(
      `${RETURN_PATH_PREFIX}${id}`,
      String(returnPath ?? "").trim()
    );
  } catch {
    // ignore
  }
}

export function readPartnerUrlReturnPath(mappingId) {
  if (typeof localStorage === "undefined") return "";
  const id = String(mappingId ?? "").trim();
  if (!id) return "";
  try {
    return String(localStorage.getItem(`${RETURN_PATH_PREFIX}${id}`) ?? "").trim();
  } catch {
    return "";
  }
}

/**
 * Append partnerVerify=1&mappingId=... so the destination tab can open the modal.
 * Preserves existing query params (including IsTest).
 */
export function appendPartnerVerifyParams(url, { mappingId } = {}) {
  const raw = String(url ?? "").trim();
  if (!raw) return raw;

  try {
    const isAbsolute = /^https?:\/\//i.test(raw);
    const base =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://spade-community.com";
    const parsed = isAbsolute ? new URL(raw) : new URL(raw, base);
    parsed.searchParams.set(PARTNER_VERIFY_QUERY_KEY, "1");
    const id = String(mappingId ?? "").trim();
    if (id) {
      parsed.searchParams.set(PARTNER_MAPPING_ID_QUERY_KEY, id);
    }
    if (isAbsolute) return parsed.toString();
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    const sep = raw.includes("?") ? "&" : "?";
    const id = String(mappingId ?? "").trim();
    const mappingPart = id
      ? `&${PARTNER_MAPPING_ID_QUERY_KEY}=${encodeURIComponent(id)}`
      : "";
    return `${raw}${sep}${PARTNER_VERIFY_QUERY_KEY}=1${mappingPart}`;
  }
}

/**
 * Read verify intent from the destination page URL.
 * @param {URLSearchParams | null | undefined} searchParams
 * @param {string} [search]
 */
export function readPartnerVerifyIntentFromSearch(searchParams, search = "") {
  let params = searchParams;
  if (!params || typeof params.get !== "function") {
    try {
      const query = String(search ?? "").startsWith("?")
        ? String(search).slice(1)
        : String(search ?? "");
      params = new URLSearchParams(query);
    } catch {
      return null;
    }
  }

  const flag = String(params.get(PARTNER_VERIFY_QUERY_KEY) ?? "")
    .trim()
    .toLowerCase();
  if (flag !== "1" && flag !== "true" && flag !== "yes") {
    return null;
  }

  const mappingId = String(params.get(PARTNER_MAPPING_ID_QUERY_KEY) ?? "").trim();
  return {
    mappingId,
    partnerUrl: "",
    token: "",
    returnPath: readPartnerUrlReturnPath(mappingId),
  };
}

/** @deprecated Prefer URL params; kept for transitional reads during sanitize. */
export function readPartnerUrlVerifyContext({ token } = {}) {
  void token;
  return null;
}

export function clearPartnerUrlVerifyContext() {
  // No-op for legacy sessionStorage key cleanup
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem("partnerUrlVerifyContext");
  } catch {
    // ignore
  }
}

export function extractDoSurveyToken(partnerUrl) {
  return extractDoSurveyTokenFromUrl(partnerUrl);
}

/** Resolve same-origin path+search+hash for SPA navigation. */
export function toSameOriginNavigateTarget(partnerUrl) {
  const raw = String(partnerUrl ?? "").trim();
  if (!raw || typeof window === "undefined") return null;

  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.origin !== window.location.origin) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    if (raw.startsWith("/")) return raw;
    return null;
  }
}
