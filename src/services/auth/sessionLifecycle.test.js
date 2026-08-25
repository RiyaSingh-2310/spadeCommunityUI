import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLastActivityAt,
  SESSION_INACTIVITY_MS,
  startAuthSessionLifecycle,
  stopAuthSessionLifecycle,
} from "./sessionLifecycle";

vi.mock("./refreshSession", () => ({
  tryRefreshAuthSession: vi.fn(async () => false),
}));

describe("admin inactivity session lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T12:00:00.000Z"));
    localStorage.setItem("authToken", "test-token");
  });

  afterEach(() => {
    stopAuthSessionLifecycle();
    localStorage.clear();
    vi.useRealTimers();
  });

  it("does not log out while the user keeps interacting", () => {
    const onIdleLogout = vi.fn();
    startAuthSessionLifecycle({ onIdleLogout });

    for (let minute = 1; minute <= 10; minute += 1) {
      vi.advanceTimersByTime(60_000);
      window.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));
    }

    expect(onIdleLogout).not.toHaveBeenCalled();
  });

  it("logs out after 7 minutes of complete inactivity", () => {
    const onIdleLogout = vi.fn();
    startAuthSessionLifecycle({ onIdleLogout });

    vi.advanceTimersByTime(SESSION_INACTIVITY_MS - 1_000);
    expect(onIdleLogout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);
    expect(onIdleLogout).toHaveBeenCalledTimes(1);
  });

  it("resets the idle window after activity at 6 minutes", () => {
    const onIdleLogout = vi.fn();
    startAuthSessionLifecycle({ onIdleLogout });

    vi.advanceTimersByTime(6 * 60_000);
    window.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));

    vi.advanceTimersByTime(6 * 60_000);
    expect(onIdleLogout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    expect(onIdleLogout).toHaveBeenCalledTimes(1);
  });

  it("does not treat tab visibility or window focus as user activity", () => {
    const onIdleLogout = vi.fn();
    startAuthSessionLifecycle({ onIdleLogout });
    const startedAt = getLastActivityAt();

    vi.advanceTimersByTime(2 * 60_000);
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));

    expect(getLastActivityAt()).toBe(startedAt);

    vi.advanceTimersByTime(SESSION_INACTIVITY_MS - 2 * 60_000);
    expect(onIdleLogout).toHaveBeenCalledTimes(1);
  });

  it("logs out when returning to a tab that was idle for more than 7 minutes", () => {
    const onIdleLogout = vi.fn();
    startAuthSessionLifecycle({ onIdleLogout });

    vi.advanceTimersByTime(SESSION_INACTIVITY_MS + 30_000);
    document.dispatchEvent(new Event("visibilitychange"));

    expect(onIdleLogout).toHaveBeenCalledTimes(1);
  });

  it("registers a single idle handler even if start is called again", () => {
    const first = vi.fn();
    const second = vi.fn();
    startAuthSessionLifecycle({ onIdleLogout: first });
    startAuthSessionLifecycle({ onIdleLogout: second });

    vi.advanceTimersByTime(SESSION_INACTIVITY_MS);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
