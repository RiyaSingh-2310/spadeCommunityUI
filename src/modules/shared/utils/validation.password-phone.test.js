import { describe, expect, it } from "vitest";
import {
  getNewPasswordError,
  NEW_PASSWORD_SAME_AS_CURRENT_MESSAGE,
} from "./validation";
import {
  getNationalPhoneLength,
  getPanelistMobileError,
  getPhoneError,
  limitNationalPhoneDigits,
} from "./phoneValidation";

describe("new password must differ from current", () => {
  it("rejects a new password that matches the current password", () => {
    expect(getNewPasswordError("Abcdef12", "Abcdef12")).toBe(
      NEW_PASSWORD_SAME_AS_CURRENT_MESSAGE
    );
  });

  it("allows a different valid new password", () => {
    expect(getNewPasswordError("Newpass12", "Oldpass12")).toBe("");
  });
});

describe("country-based phone validation", () => {
  it("requires exactly 10 digits for India", () => {
    expect(getNationalPhoneLength("IN")).toBe(10);
    expect(getPhoneError("+91 9876543210", { defaultCountryCode: "IN" })).toBe("");
    expect(
      getPhoneError("+91 987654321", { defaultCountryCode: "IN", label: "Contact Number" })
    ).toContain("exactly 10 digits");
    expect(limitNationalPhoneDigits("9876543210123", 10)).toBe("9876543210");
    expect(limitNationalPhoneDigits("98a76.54 32", 10)).toBe("98765432");
  });

  it("requires the selected country's national length", () => {
    expect(getNationalPhoneLength("SG")).toBe(8);
    expect(getNationalPhoneLength("AE")).toBe(9);
    expect(
      getPhoneError("+65 61234567", { defaultCountryCode: "SG", label: "Contact Number" })
    ).toBe("");
    expect(
      getPhoneError("+65 6123456", { defaultCountryCode: "SG", label: "Contact Number" })
    ).toContain("exactly 8 digits");
  });
});

describe("panelist mobile", () => {
  it("allows empty optional values and requires 10 digits when present", () => {
    expect(getPanelistMobileError("")).toBe("");
    expect(getPanelistMobileError("9876543210")).toBe("");
    expect(getPanelistMobileError("98765")).toContain("exactly 10 digits");
    expect(getPanelistMobileError("98765432101")).toContain("exactly 10 digits");
  });
});
