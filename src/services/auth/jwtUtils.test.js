import { describe, expect, it } from "vitest";
import {
  getJwtExpiryMs,
  getJwtMsUntilExpiry,
  isJwtExpired,
} from "./jwtUtils";

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

describe("jwtUtils", () => {
  it("reads standard JWT exp in seconds", () => {
    const expSeconds = Math.floor(Date.now() / 1000) + 3600;
    const token = encodeJwt({ exp: expSeconds });
    expect(getJwtExpiryMs(token)).toBe(expSeconds * 1000);
    expect(getJwtMsUntilExpiry(token)).toBeGreaterThan(3_000_000);
  });

  it("reads millisecond exp values without multiplying again", () => {
    const expMs = Date.now() + 60 * 60 * 1000;
    const token = encodeJwt({ exp: expMs });
    expect(getJwtExpiryMs(token)).toBe(expMs);
  });

  it("treats a future exp as not expired", () => {
    const token = encodeJwt({ exp: Math.floor(Date.now() / 1000) + 30 * 60 });
    expect(isJwtExpired(token)).toBe(false);
  });

  it("treats a past exp as expired", () => {
    const token = encodeJwt({ exp: Math.floor(Date.now() / 1000) - 30 });
    expect(isJwtExpired(token)).toBe(true);
  });

  it("returns null when exp cannot be read", () => {
    expect(isJwtExpired("")).toBe(null);
    expect(isJwtExpired("opaque-token")).toBe(null);
  });
});
