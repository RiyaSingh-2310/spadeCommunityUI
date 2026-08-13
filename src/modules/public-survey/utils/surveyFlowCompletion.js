/**
 * Session-scoped Partner URL survey completion gate.
 * Prevents restarting the same token+uid flow after reaching a result page.
 */

const STORAGE_PREFIX = "spadeSurveyFlowCompleted:";

function storageKey(token, uid) {
  const safeToken = String(token ?? "").trim();
  const safeUid = String(uid ?? "").trim();
  if (!safeToken || !safeUid) return "";
  return `${STORAGE_PREFIX}${safeToken}:${safeUid}`;
}

/**
 * @param {{ token?: string, uid?: string, outcome?: string }} params
 */
export function markSurveyFlowCompleted({ token, uid, outcome = "complete" } = {}) {
  if (typeof sessionStorage === "undefined") return;
  const key = storageKey(token, uid);
  if (!key) return;
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        outcome: String(outcome ?? "complete").trim() || "complete",
        at: Date.now(),
      })
    );
  } catch {
    // ignore quota / private mode
  }
}

/**
 * @param {{ token?: string, uid?: string }} params
 * @returns {{ outcome: string, at: number } | null}
 */
export function readSurveyFlowCompleted({ token, uid } = {}) {
  if (typeof sessionStorage === "undefined") return null;
  const key = storageKey(token, uid);
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const outcome = String(parsed.outcome ?? "complete").trim() || "complete";
    return { outcome, at: Number(parsed.at) || 0 };
  } catch {
    return null;
  }
}
