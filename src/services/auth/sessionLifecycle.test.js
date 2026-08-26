import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tryRefreshAuthSession } from "./refreshSession";
import {
  startAuthSessionLifecycle,
  stopAuthSessionLifecycle,
} from "./sessionLifecycle";

vi.mock("./refreshSession", () => ({
  tryRefreshAuthSession: vi.fn(async () => false),
}));

function encodeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${header}.${body}.sig`;
}

function setAccessToken(expSecondsFromNow) {
  const token = encodeJwt({
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
  });
  localStorage.setItem("authToken", token);
  return token;
}

describe("admin token-expiry session lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-26T12:00:00.000Z"));
    localStorage.clear();
    tryRefreshAuthSession.mockResolvedValue(false);
  });

  afterEach(() => {
    stopAuthSessionLifecycle();
    localStorage.clear();
    vi.useRealTimers();
  });

  it("does not log out while the JWT is still valid, even with no activity", () => {
    setAccessToken(60 * 60);
    const onSessionExpired = vi.fn();
    startAuthSessionLifecycle({ onSessionExpired });

    vi.advanceTimersByTime(10 * 60 * 1000);
    window.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    document.dispatchEvent(new Event("visibilitychange"));

    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("does not log out an opaque token after a fixed idle duration", () => {
    localStorage.setItem("authToken", "opaque-token");
    const onSessionExpired = vi.fn();
    startAuthSessionLifecycle({ onSessionExpired });

    vi.advanceTimersByTime(30 * 60 * 1000);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("logs out when the JWT expires and refresh is unavailable", async () => {
    setAccessToken(30);
    const onSessionExpired = vi.fn();
    startAuthSessionLifecycle({ onSessionExpired });

    vi.advanceTimersByTime(24_000);
    expect(onSessionExpired).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2_000);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("refreshes before expiry instead of logging out when a refresh token exists", async () => {
    setAccessToken(30);
    localStorage.setItem("refreshToken", "refresh-token");
    tryRefreshAuthSession.mockImplementation(async () => {
      setAccessToken(60 * 60);
      return true;
    });

    const onSessionExpired = vi.fn();
    startAuthSessionLifecycle({ onSessionExpired });

    await vi.advanceTimersByTimeAsync(30_000);
    expect(tryRefreshAuthSession).toHaveBeenCalled();
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("logs out once if refresh fails at token expiry", async () => {
    setAccessToken(20);
    localStorage.setItem("refreshToken", "stale-refresh");
    tryRefreshAuthSession.mockResolvedValue(false);

    const onSessionExpired = vi.fn();
    startAuthSessionLifecycle({ onSessionExpired });
    startAuthSessionLifecycle({ onSessionExpired });

    await vi.advanceTimersByTimeAsync(25_000);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
