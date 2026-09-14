import { describe, expect, it } from "vitest";
import { mapLoginResponse } from "./mapLoginResponse";

describe("mapLoginResponse partner login", () => {
  it("maps POST /api/partner/login data.token and data.partner", () => {
    const mapped = mapLoginResponse({
      success: true,
      message: "Login successful!",
      data: {
        token: "partner-jwt",
        partner: {
          id: 42,
          email: "partner@example.com",
          name: "Acme Panel",
          status: "active",
        },
      },
    });

    expect(mapped.success).toBe(true);
    expect(mapped.token).toBe("partner-jwt");
    expect(mapped.admin?.id).toBe(42);
    expect(mapped.admin?.email).toBe("partner@example.com");
  });

  it("maps a top-level token with a partner user in data", () => {
    const mapped = mapLoginResponse({
      success: true,
      token: "top-level-jwt",
      data: {
        id: 7,
        email: "partner@example.com",
        name: "Partner Seven",
      },
    });

    expect(mapped.token).toBe("top-level-jwt");
    expect(mapped.admin?.id).toBe(7);
    expect(mapped.admin?.email).toBe("partner@example.com");
  });
});
