const UID_QUERY_KEYS = ["uid", "identifier", "participant_id", "participantId", "pid"];

export function normalizeRespondentUid(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  // Backend template placeholders — treat as missing until a real id is supplied.
  const key = trimmed.toLowerCase();
  if (
    key === "[identifier]" ||
    key === "identifier" ||
    key === "{identifier}" ||
    key.startsWith("xxx")
  ) {
    return null;
  }
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
  if (
    text.includes("already filled") ||
    text.includes("already completed") ||
    text.includes("already submitted")
  ) {
    return "submitted";
  }
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

function coerceHelperText(value) {
  return String(value ?? "").trim();
}

function isExplicitTrue(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    coerceHelperText(value).toLowerCase() === "true"
  );
}

function isExplicitFalse(value) {
  return (
    value === false ||
    value === 0 ||
    value === "0" ||
    coerceHelperText(value).toLowerCase() === "false"
  );
}

function readFirstDefined(record, keys) {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function unwrapAccessPayload(source) {
  if (source == null) return {};
  if (typeof source !== "object") {
    return { message: coerceHelperText(source) };
  }

  const isError = source instanceof Error;
  const nestedSource = isError ? source.data : source.data;
  const nested =
    nestedSource && typeof nestedSource === "object" && !Array.isArray(nestedSource)
      ? nestedSource
      : null;
  const deeper =
    nested?.data && typeof nested.data === "object" && !Array.isArray(nested.data)
      ? nested.data
      : null;

  return {
    ...(!isError ? source : {}),
    ...(nested || {}),
    ...(deeper || {}),
    message:
      coerceHelperText(deeper?.message) ||
      coerceHelperText(nested?.message) ||
      coerceHelperText(source.message),
  };
}

function kindFromStatus(status) {
  const key = coerceHelperText(status)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (!key) return "";

  if (
    [
      "completed",
      "complete",
      "already_filled",
      "alreadyfilled",
      "filled",
      "submitted",
    ].includes(key)
  ) {
    return "completed";
  }
  if (["in_progress", "inprogress", "started", "ongoing"].includes(key)) {
    return "in_progress";
  }
  if (
    [
      "no_access",
      "noaccess",
      "denied",
      "forbidden",
      "blocked",
      "unauthorized",
      "unavailable",
      "access_denied",
    ].includes(key)
  ) {
    return "no_access";
  }
  return "";
}

function kindFromMessage(message) {
  const text = coerceHelperText(message).toLowerCase();
  if (!text) return "";
  if (
    text.includes("already filled") ||
    text.includes("already completed") ||
    text.includes("already submitted") ||
    text.includes("survey completed")
  ) {
    return "completed";
  }
  if (
    text.includes("in progress") ||
    text.includes("already started") ||
    text.includes("already in progress")
  ) {
    return "in_progress";
  }
  if (
    text.includes("no access") ||
    text.includes("access denied") ||
    text.includes("not allowed") ||
    text.includes("not authorized") ||
    text.includes("unauthorized") ||
    text.includes("permission denied")
  ) {
    return "no_access";
  }
  return "";
}

/**
 * Decide whether Start Survey is allowed from an API payload or thrown error.
 * Prefers status/code/flag; falls back to message text when that is all the API gives.
 *
 * @param {unknown} source
 * @returns {{
 *   canStart: boolean,
 *   blocked: boolean,
 *   message: string,
 *   kind: "ok" | "completed" | "in_progress" | "no_access" | "error",
 * }}
 */
export function interpretSurveyStartAccess(source) {
  if (source == null) {
    return { canStart: true, blocked: false, message: "", kind: "ok" };
  }

  const payload = unwrapAccessPayload(source);
  const message = coerceHelperText(
    payload.message ??
      payload.msg ??
      (typeof source === "object" ? source.message : source)
  );

  const status = coerceHelperText(
    readFirstDefined(payload, [
      "status",
      "surveyStatus",
      "survey_status",
      "activityStatus",
      "activity_status",
      "code",
      "errorCode",
      "error_code",
      "reason",
    ])
  );

  const canStartFlag = readFirstDefined(payload, [
    "canStart",
    "can_start",
    "allowStart",
    "allow_start",
    "startAllowed",
    "start_allowed",
  ]);
  const hasAccessFlag = readFirstDefined(payload, [
    "hasAccess",
    "has_access",
    "access",
  ]);
  const completedFlag = readFirstDefined(payload, [
    "isCompleted",
    "is_completed",
    "alreadyFilled",
    "already_filled",
    "completed",
  ]);
  const inProgressFlag = readFirstDefined(payload, [
    "inProgress",
    "in_progress",
    "isInProgress",
    "is_in_progress",
  ]);
  const noAccessFlag = readFirstDefined(payload, [
    "noAccess",
    "no_access",
    "accessDenied",
    "access_denied",
  ]);

  const kindFromFlags = isExplicitTrue(completedFlag)
    ? "completed"
    : isExplicitTrue(inProgressFlag)
      ? "in_progress"
      : isExplicitTrue(noAccessFlag) || isExplicitFalse(hasAccessFlag)
        ? "no_access"
        : "";
  const kind = kindFromFlags || kindFromStatus(status) || kindFromMessage(message);

  if (isExplicitFalse(canStartFlag) || kindFromFlags || kindFromStatus(status)) {
    return {
      canStart: false,
      blocked: true,
      message,
      kind: kind || "no_access",
    };
  }

  const success = payload.success;
  const successFalse =
    success === false ||
    success === 0 ||
    success === "0" ||
    coerceHelperText(success).toLowerCase() === "false";

  const httpStatus = source instanceof Error ? Number(source.status) || 0 : 0;
  if (httpStatus === 401 || httpStatus === 403) {
    return {
      canStart: false,
      blocked: true,
      message,
      kind: kind || "no_access",
    };
  }

  if (successFalse || isExplicitTrue(source?.surveyStartBlocked)) {
    const blocked = Boolean(kind);
    return {
      canStart: false,
      blocked,
      message,
      kind: kind || "error",
    };
  }

  if (kind) {
    return {
      canStart: false,
      blocked: true,
      message,
      kind,
    };
  }

  return {
    canStart: true,
    blocked: false,
    message,
    kind: "ok",
  };
}

export function isSurveyStartBlockedError(error) {
  if (!error) return false;
  if (error.surveyStartBlocked === true) return true;
  return interpretSurveyStartAccess(error).blocked === true;
}
