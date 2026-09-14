import { describe, expect, it } from "vitest";
import { isEncryptedValue } from "../../modules/shared/utils/encryption";
import {
  buildCreatePartnerPayload,
  buildUpdatePartnerPayload,
  extractPartnerProfileRecord,
} from "./partnersApi";

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

describe("GET /api/partner/me mapping", () => {
  it("reads the partner record from data", () => {
    const partner = extractPartnerProfileRecord({
      success: true,
      data: {
        id: 105,
        email: "partner@example.com",
        name: "Acme Panel",
        code: "P-105",
        status: "active",
      },
    });

    expect(partner).toMatchObject({
      id: 105,
      email: "partner@example.com",
      name: "Acme Panel",
      code: "P-105",
    });
  });

  it("reads nested partner objects and ignores login tokens", () => {
    const partner = extractPartnerProfileRecord({
      success: true,
      data: {
        token: "jwt",
        partner: {
          id: 9,
          email: "me@example.com",
          name: "Nine",
        },
      },
    });

    expect(partner).toMatchObject({
      id: 9,
      email: "me@example.com",
    });
  });
});
