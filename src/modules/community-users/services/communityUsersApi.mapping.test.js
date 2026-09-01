import { describe, expect, it } from "vitest";
import { mapPanelistToForm } from "./communityUsersApi";

describe("mapPanelistToForm", () => {
  it("prefills mobile from mobile_number when phone is empty", () => {
    const mapped = mapPanelistToForm({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "",
      mobile_number: "9876543210",
      status: "active",
    });

    expect(mapped.mobileNumber).toBe("9876543210");
    expect(mapped.name).toBe("Ada Lovelace");
    expect(mapped.email).toBe("ada@example.com");
    expect(mapped.status).toBe("Active");
  });

  it("does not treat display dashes as a saved phone", () => {
    const mapped = mapPanelistToForm({
      phone: "—",
      mobileNumber: "9123456789",
    });

    expect(mapped.mobileNumber).toBe("9123456789");
  });
});
