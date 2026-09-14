import { afterEach, describe, expect, it } from "vitest";
import { LOGIN_ROLES, clearLoginRole, saveLoginRole } from "./loginRole";
import { getPartnerIdentityFromToken, getSessionPartnerId } from "./sessionIdentity";

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

describe("sessionIdentity partner", () => {
  afterEach(() => {
    clearLoginRole();
    localStorage.clear();
  });

  it("reads partner id from a partner login JWT", () => {
    const token = encodeJwt({ id: 105, email: "partner@example.com" });
    expect(getPartnerIdentityFromToken(token)).toEqual({
      id: "105",
      email: "partner@example.com",
    });
  });

  it("uses the JWT partner id when the session user has no id", () => {
    saveLoginRole(LOGIN_ROLES.PARTNER);
    localStorage.setItem(
      "authToken",
      encodeJwt({ id: 105, email: "partner@example.com" })
    );
    expect(getSessionPartnerId()).toBe("105");
  });
});
