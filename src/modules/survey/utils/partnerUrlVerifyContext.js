/**
 * Partner URL email-verification handoff.
 *
 * Intent is passed via URL query params when Partner Mapping opens a new tab.
 * Pending verification is also stashed in `sessionStorage` (same tab) so the
 * modal survives refresh / remount after URL params are sanitized.
 * Verified flag lives in `localStorage` (shared across tabs).
 */

export const PARTNER_VERIFY_QUERY_KEY = "partnerVerify";
export const PARTNER_MAPPING_ID_QUERY_KEY = "mappingId";

const VERIFIED_PREFIX = "partnerUrlOtpVerified:";
const RETURN_PATH_PREFIX = "partnerUrlVerifyReturn:";
const PENDING_VERIFY_KEY = "partnerUrlVerifyPending";

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

/**
 * Persist pending verify intent for this browser tab so the modal can reopen
 * after refresh, remount, or URL sanitize that strips partnerVerify params.
 * @param {{ mappingId?: string, partnerUrl?: string, token?: string, returnPath?: string }} context
 */
export function stashPartnerUrlVerifyPending(context) {
  if (typeof sessionStorage === "undefined") return;
  const mappingId = String(context?.mappingId ?? "").trim();
  if (!mappingId) return;
  try {
    sessionStorage.setItem(
      PENDING_VERIFY_KEY,
      JSON.stringify({
        mappingId,
        partnerUrl: String(context?.partnerUrl ?? "").trim(),
        token: String(context?.token ?? "").trim(),
        returnPath:
          String(context?.returnPath ?? "").trim() ||
          readPartnerUrlReturnPath(mappingId),
      })
    );
  } catch {
    // ignore quota / private mode
  }
}

/** @returns {{ mappingId: string, partnerUrl: string, token: string, returnPath: string } | null} */
export function readPartnerUrlVerifyPending() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_VERIFY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const mappingId = String(parsed?.mappingId ?? "").trim();
    if (!mappingId) return null;
    return {
      mappingId,
      partnerUrl: String(parsed?.partnerUrl ?? "").trim(),
      token: String(parsed?.token ?? "").trim(),
      returnPath:
        String(parsed?.returnPath ?? "").trim() ||
        readPartnerUrlReturnPath(mappingId),
    };
  } catch {
    return null;
  }
}

export function clearPartnerUrlVerifyPending() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_VERIFY_KEY);
  } catch {
    // ignore
  }
}

/** @deprecated Prefer URL params; kept for transitional reads during sanitize. */
export function readPartnerUrlVerifyContext({ token } = {}) {
  void token;
  return null;
}

export function clearPartnerUrlVerifyContext() {
  clearPartnerUrlVerifyPending();
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
