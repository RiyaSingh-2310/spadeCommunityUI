import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ROUTES } from "../../config/api";
import { LOGIN_ROLES } from "./loginRole";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../modules/shared/utils/encryption", () => ({
  encryptValue: (value) => `enc:${value}`,
}));

import { apiRequest } from "../api/client";
import { loginAdmin, resolveLoginRoute } from "./authApi";

describe("partner login API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses POST /api/partner/login", () => {
    expect(resolveLoginRoute(LOGIN_ROLES.PARTNER)).toBe("/api/partner/login");
    expect(API_ROUTES.partners.login).toBe("/api/partner/login");
  });

  it("sends email and encrypted password without a login bearer", async () => {
    apiRequest.mockImplementation(async (path) => {
      if (path === "/api/partner/login") {
        return {
          success: true,
          message: "Login successful!",
          data: {
            token: "partner-jwt",
            partner: {
              id: 12,
              email: "partner@example.com",
              name: "Acme",
              status: "active",
            },
          },
        };
      }
      return {
        success: true,
        data: {
          id: 12,
          email: "partner@example.com",
          name: "Acme",
          status: "active",
        },
      };
    });

    const result = await loginAdmin({
      email: "partner@example.com",
      password: "plain-password",
      loginRole: LOGIN_ROLES.PARTNER,
    });

    expect(apiRequest).toHaveBeenCalledWith("/api/partner/login", {
      method: "POST",
      auth: false,
      loginBearer: false,
      body: {
        email: "partner@example.com",
        password: "enc:plain-password",
      },
    });
    expect(apiRequest).toHaveBeenCalledWith("/api/partner/me", {
      method: "GET",
      auth: false,
      headers: { Authorization: "Bearer partner-jwt" },
    });
    expect(result.token).toBe("partner-jwt");
    expect(String(result.admin?.id)).toBe("12");
  });
});
