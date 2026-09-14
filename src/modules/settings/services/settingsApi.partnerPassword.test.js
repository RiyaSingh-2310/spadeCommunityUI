import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOGIN_ROLES, saveLoginRole, clearLoginRole } from "../../../services/auth/loginRole";
import { isEncryptedValue } from "../../shared/utils/encryption";

vi.mock("../../../services/api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/client";
import { changePassword } from "./settingsApi";

describe("partner change password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearLoginRole();
    saveLoginRole(LOGIN_ROLES.PARTNER);
    apiRequest.mockResolvedValue({ success: true, message: "Password updated." });
  });

  it("PUTs encrypted passwords to /api/partner/change-password", async () => {
    await changePassword({
      currentPassword: "OldPass1",
      newPassword: "NewPass1",
      confirmPassword: "NewPass1",
    });

    expect(apiRequest).toHaveBeenCalledTimes(1);
    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/partner/change-password");
    expect(options.method).toBe("PUT");
    expect(isEncryptedValue(options.body.currentPassword)).toBe(true);
    expect(isEncryptedValue(options.body.newPassword)).toBe(true);
    expect(options.body.confirmPassword).toBe(options.body.newPassword);
  });
});
