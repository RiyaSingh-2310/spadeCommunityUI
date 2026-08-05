const PARTNER_URL_VERIFY_CONTEXT_KEY = "partnerUrlVerifyContext";

function extractDoSurveyTokenFromUrl(partnerUrl) {
  const raw = String(partnerUrl ?? "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw, typeof window !== "undefined" ? window.location.origin : "https://local");
    const match = parsed.pathname.match(/\/dosurvey\/([^/]+)\/?/i);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  } catch {
    const match = raw.match(/\/dosurvey\/([^/?#]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  }
}

export function getPartnerUrlOtpSessionKey(mappingId) {
  return mappingId ? `partnerUrlOtpVerified:${String(mappingId)}` : "";
}

/**
 * Stash verify context before navigating to the Partner URL destination page.
 * Consumed by DoSurveyStartPage after mount.
 */
export function stashPartnerUrlVerifyContext({
  mappingId,
  returnPath,
  partnerUrl,
} = {}) {
  if (typeof sessionStorage === "undefined") return;

  const payload = {
    mappingId: String(mappingId ?? "").trim(),
    returnPath: String(returnPath ?? "").trim(),
    partnerUrl: String(partnerUrl ?? "").trim(),
    token: extractDoSurveyTokenFromUrl(partnerUrl),
    createdAt: Date.now(),
  };

  sessionStorage.setItem(PARTNER_URL_VERIFY_CONTEXT_KEY, JSON.stringify(payload));
}

/**
 * Read pending verify context for the current dosurvey page.
 * @param {{ token?: string }} [options]
 */
export function readPartnerUrlVerifyContext({ token } = {}) {
  if (typeof sessionStorage === "undefined") return null;

  const raw = sessionStorage.getItem(PARTNER_URL_VERIFY_CONTEXT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const contextToken = String(parsed.token ?? "").trim();
    const pageToken = String(token ?? "").trim();
    if (pageToken && contextToken && contextToken !== pageToken) {
      return null;
    }

    return {
      mappingId: String(parsed.mappingId ?? "").trim(),
      returnPath: String(parsed.returnPath ?? "").trim(),
      partnerUrl: String(parsed.partnerUrl ?? "").trim(),
      token: contextToken,
    };
  } catch {
    return null;
  }
}

export function clearPartnerUrlVerifyContext() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PARTNER_URL_VERIFY_CONTEXT_KEY);
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
