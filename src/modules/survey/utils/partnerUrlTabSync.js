/**
 * Cross-tab sync so Partner URL tabs close when the Admin Panel logs out.
 *
 * Uses three complementary mechanisms (no backend):
 * 1. Window refs from `window.open` — closes tabs even after they leave this origin.
 * 2. BroadcastChannel + localStorage — notifies same-origin Partner URL tabs to self-close.
 * 3. sessionStorage flag — marks tabs opened from Partner Mapping (survives refresh).
 */

import { extractDoSurveyToken } from "./partnerUrlVerifyContext";

const CHANNEL_NAME = "spade-partner-url-admin-logout";
const LOGOUT_STORAGE_KEY = "partnerUrlTabs:adminLogoutAt";
const PENDING_TOKENS_KEY = "partnerUrlTabs:pendingOpenTokens";
const TAB_FLAG_KEY = "partnerUrlTabs:openedFromAdmin";
const PENDING_TOKEN_TTL_MS = 30_000;

/** @type {Set<Window>} */
const openPartnerWindows = new Set();

function pruneClosedWindows() {
  for (const win of [...openPartnerWindows]) {
    try {
      if (!win || win.closed) openPartnerWindows.delete(win);
    } catch {
      openPartnerWindows.delete(win);
    }
  }
}

/**
 * Keep a reference to a script-opened Partner URL tab so logout can close it.
 * @param {Window | null} win
 */
export function registerPartnerUrlWindow(win) {
  if (typeof window === "undefined" || !win) return;
  pruneClosedWindows();
  openPartnerWindows.add(win);
}

/**
 * Record that Admin is about to open a Partner URL (same-origin /dosurvey/:token).
 * The new tab claims this hint and marks itself as admin-opened.
 * @param {string} partnerUrl
 */
export function notePartnerUrlTabOpening(partnerUrl) {
  if (typeof localStorage === "undefined") return;
  const token = extractDoSurveyToken(partnerUrl);
  if (!token) return;

  try {
    const now = Date.now();
    let pending = [];
    try {
      const raw = localStorage.getItem(PENDING_TOKENS_KEY);
      pending = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(pending)) pending = [];
    } catch {
      pending = [];
    }

    pending = pending.filter(
      (entry) =>
        entry &&
        typeof entry.token === "string" &&
        typeof entry.at === "number" &&
        now - entry.at < PENDING_TOKEN_TTL_MS
    );
    pending.push({ token, at: now });
    localStorage.setItem(PENDING_TOKENS_KEY, JSON.stringify(pending));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * If this /dosurvey/:token tab was just opened from Admin, mark it for logout sync.
 * Also marks when Partner Mapping verify intent is present.
 * @param {{ token?: string, hasAdminVerifyIntent?: boolean }} options
 */
export function claimPartnerUrlTabAsAdminOpened({
  token,
  hasAdminVerifyIntent = false,
} = {}) {
  if (typeof sessionStorage === "undefined") return false;

  if (hasAdminVerifyIntent) {
    markPartnerUrlTabAsAdminOpened();
    return true;
  }

  const pageToken = String(token ?? "").trim();
  if (!pageToken || typeof localStorage === "undefined") {
    return isPartnerUrlTabOpenedFromAdmin();
  }

  try {
    const raw = localStorage.getItem(PENDING_TOKENS_KEY);
    if (!raw) return isPartnerUrlTabOpenedFromAdmin();

    const now = Date.now();
    let pending = [];
    try {
      pending = JSON.parse(raw);
      if (!Array.isArray(pending)) pending = [];
    } catch {
      return isPartnerUrlTabOpenedFromAdmin();
    }

    const matchIndex = pending.findIndex(
      (entry) =>
        entry &&
        String(entry.token) === pageToken &&
        typeof entry.at === "number" &&
        now - entry.at < PENDING_TOKEN_TTL_MS
    );

    if (matchIndex < 0) return isPartnerUrlTabOpenedFromAdmin();

    pending.splice(matchIndex, 1);
    const stillFresh = pending.filter(
      (entry) =>
        entry &&
        typeof entry.token === "string" &&
        typeof entry.at === "number" &&
        now - entry.at < PENDING_TOKEN_TTL_MS
    );
    if (stillFresh.length) {
      localStorage.setItem(PENDING_TOKENS_KEY, JSON.stringify(stillFresh));
    } else {
      localStorage.removeItem(PENDING_TOKENS_KEY);
    }

    markPartnerUrlTabAsAdminOpened();
    return true;
  } catch {
    return isPartnerUrlTabOpenedFromAdmin();
  }
}

function markPartnerUrlTabAsAdminOpened() {
  try {
    sessionStorage.setItem(TAB_FLAG_KEY, "1");
  } catch {
    // ignore
  }
}

export function isPartnerUrlTabOpenedFromAdmin() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(TAB_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function closeTrackedPartnerWindows() {
  pruneClosedWindows();
  for (const win of [...openPartnerWindows]) {
    try {
      if (win && !win.closed) win.close();
    } catch {
      // ignore cross-origin / already closed
    }
    openPartnerWindows.delete(win);
  }
}

/**
 * Call from Admin logout: close all tracked Partner URL windows and notify other tabs.
 */
export function notifyPartnerUrlTabsAdminLogout() {
  if (typeof window === "undefined") return;

  closeTrackedPartnerWindows();

  const at = String(Date.now());

  try {
    // Distinct value each logout so other tabs always receive a storage event.
    localStorage.setItem(LOGOUT_STORAGE_KEY, at);
  } catch {
    // ignore
  }

  try {
    localStorage.removeItem(PENDING_TOKENS_KEY);
  } catch {
    // ignore
  }

  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: "admin-logout", at });
      channel.close();
    }
  } catch {
    // ignore unsupported / restricted environments
  }
}

/**
 * Partner URL tab: listen for Admin logout and run `onLogout` (typically window.close).
 * @param {() => void} onLogout
 * @returns {() => void} cleanup
 */
export function subscribePartnerUrlTabAdminLogout(onLogout) {
  if (typeof window === "undefined" || typeof onLogout !== "function") {
    return () => {};
  }

  const handleLogoutSignal = () => {
    if (!isPartnerUrlTabOpenedFromAdmin()) return;
    onLogout();
  };

  /** @type {BroadcastChannel | null} */
  let channel = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event?.data?.type === "admin-logout") {
          handleLogoutSignal();
        }
      };
    }
  } catch {
    channel = null;
  }

  const handleStorage = (event) => {
    if (event.key === LOGOUT_STORAGE_KEY && event.newValue != null) {
      handleLogoutSignal();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    if (channel) {
      try {
        channel.close();
      } catch {
        // ignore
      }
    }
  };
}
