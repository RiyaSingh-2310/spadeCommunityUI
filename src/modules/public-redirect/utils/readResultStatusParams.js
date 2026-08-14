import {
  normalizeFlowUid,
  toSearchParams,
} from "../../public-survey/utils/surveyFlowParams";

const UID_QUERY_KEYS = [
  "uid",
  "identifier",
  "participant_id",
  "participantId",
  "respondent_id",
  "respondentId",
];

function firstParam(params, keys) {
  if (!params) return "";
  for (const key of keys) {
    const value = params.get?.(key);
    if (value != null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function readFromSearch(search, pathUid = "") {
  const params = toSearchParams(search);
  return {
    pid: firstParam(params, ["pid"]),
    uid:
      normalizeFlowUid(pathUid) ||
      normalizeFlowUid(firstParam(params, UID_QUERY_KEYS)),
  };
}

/**
 * Read pid + uid for survey result status APIs.
 * pid comes from the `pid` query param only (never invented).
 * uid comes from the path or known UID query keys.
 *
 * @param {{ search?: string|URLSearchParams, pathUid?: string }} input
 * @returns {{ pid: string, uid: string }}
 */
export function readResultStatusParams({ search = "", pathUid = "" } = {}) {
  const fromRouter = readFromSearch(search, pathUid);
  let pid = fromRouter.pid;
  let uid = fromRouter.uid;

  if ((!pid || !uid) && typeof window !== "undefined") {
    const fromWindow = readFromSearch(window.location.search, pathUid);
    if (!pid) pid = fromWindow.pid;
    if (!uid) uid = fromWindow.uid;
  }

  return { pid, uid };
}

export function getMissingResultStatusParamLabel({ pid, uid } = {}) {
  const missingPid = !String(pid ?? "").trim();
  const missingUid = !String(uid ?? "").trim();
  if (missingPid && missingUid) return "PID and UID";
  if (missingPid) return "PID";
  if (missingUid) return "UID";
  return "";
}
