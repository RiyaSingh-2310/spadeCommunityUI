const UID_QUERY_KEYS = ["uid", "identifier", "participant_id", "participantId", "pid"];

export function normalizeRespondentUid(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  // Backend template placeholder — treat as missing until partner substitutes a real id.
  if (trimmed === "[identifier]") return null;
  return trimmed;
}

export function readUidFromSearch(search) {
  if (search == null) return null;
  const query = String(search).startsWith("?") ? String(search).slice(1) : String(search);
  if (!query) return null;

  try {
    const params = new URLSearchParams(query);
    for (const key of UID_QUERY_KEYS) {
      const normalized = normalizeRespondentUid(params.get(key));
      if (normalized != null) return normalized;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Resolve respondent uid from router search params and window.location (SPA-safe).
 */
export function resolveRespondentUid(searchParams, locationSearch) {
  const fromRouter =
    readUidFromSearch(searchParams?.toString?.() ?? "") ??
    readUidFromSearch(locationSearch);

  if (fromRouter != null) return fromRouter;

  if (typeof window !== "undefined") {
    return readUidFromSearch(window.location.search);
  }

  return null;
}

export function classifyDoSurveyError(message) {
  const text = String(message ?? "").toLowerCase();
  if (text.includes("not active") || text.includes("expired") || text.includes("closed")) {
    return "expired";
  }
  if (text.includes("not found") || text.includes("invalid")) {
    return "invalid";
  }
  if (text.includes("quota")) {
    return "expired";
  }
  return "error";
}
