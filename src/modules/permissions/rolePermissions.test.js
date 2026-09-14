import { describe, expect, it } from "vitest";
import { LOGIN_ROLES } from "../../services/auth/loginRole";
import { getRolePermissions } from "./rolePermissions";

describe("getRolePermissions", () => {
  it("gives partners survey read and download without write", () => {
    const permissions = getRolePermissions(LOGIN_ROLES.PARTNER);
    expect(permissions.survey).toEqual({
      canRead: true,
      canWrite: false,
      canDownload: true,
    });
    expect(permissions.partners.canRead).toBe(false);
    expect(permissions.dashboard.canRead).toBe(true);
  });
});
