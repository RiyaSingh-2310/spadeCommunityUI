import { afterEach, describe, expect, it } from "vitest";
import {
  LOGIN_ROLES,
  clearLoginRole,
  getLoginRole,
  isPartnerLoginRole,
  saveLoginRole,
} from "./loginRole";

describe("loginRole", () => {
  afterEach(() => {
    clearLoginRole();
  });

  it("stores and reads the partner login role", () => {
    saveLoginRole(LOGIN_ROLES.PARTNER);
    expect(getLoginRole()).toBe(LOGIN_ROLES.PARTNER);
    expect(isPartnerLoginRole()).toBe(true);
  });
});
