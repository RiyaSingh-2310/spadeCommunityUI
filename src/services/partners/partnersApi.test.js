import { describe, expect, it } from "vitest";
import { isEncryptedValue } from "../../modules/shared/utils/encryption";
import { buildCreatePartnerPayload, buildUpdatePartnerPayload } from "./partnersApi";

const baseForm = {
  name: "Partner A",
  email: "partner@example.com",
  contactNumber: "9876543210",
  country: "India",
  contactPerson: "Alex",
  website: "",
  panelSize: "100",
  complete: "",
  terminate: "",
  overQuota: "",
  qualityTerm: "",
  surveyClose: "",
  aboutPartner: "",
  status: "Active",
  password: "Secret123",
  confirmPassword: "Secret123",
};

describe("partner credentials payload", () => {
  it("encrypts matching create passwords with the same ciphertext", () => {
    const payload = buildCreatePartnerPayload(baseForm);
    expect(isEncryptedValue(payload.password)).toBe(true);
    expect(payload.password).not.toBe("Secret123");
    expect(payload.confirm_password).toBe(payload.password);
  });

  it("omits password on update when it is empty", () => {
    const payload = buildUpdatePartnerPayload({
      ...baseForm,
      password: "",
      confirmPassword: "",
    });
    expect(payload.password).toBeUndefined();
    expect(payload.confirm_password).toBeUndefined();
  });
});
