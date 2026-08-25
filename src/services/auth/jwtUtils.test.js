import { describe, expect, it } from "vitest";
import {
  getJwtExpiryMs,
  getJwtMsUntilExpiry,
  shouldInvalidateSessionOn401,
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

  it("does not treat a still-valid JWT as session-expired on 401", () => {
    const token = encodeJwt({ exp: Math.floor(Date.now() / 1000) + 30 * 60 });
    expect(shouldInvalidateSessionOn401(token)).toBe(false);
  });

  it("treats an expired JWT as session-expired on 401", () => {
    const token = encodeJwt({ exp: Math.floor(Date.now() / 1000) - 30 });
    expect(shouldInvalidateSessionOn401(token)).toBe(true);
  });

  it("treats missing or opaque tokens as expired on 401", () => {
    expect(shouldInvalidateSessionOn401("")).toBe(true);
    expect(shouldInvalidateSessionOn401("opaque-token")).toBe(true);
  });
});
