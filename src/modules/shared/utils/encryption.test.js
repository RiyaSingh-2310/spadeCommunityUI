import { describe, expect, it } from "vitest";
import { encryptValue, isEncryptedValue } from "./encryption";

describe("encryptValue", () => {
  it("does not send the raw password", () => {
    const encrypted = encryptValue("123456");
    expect(encrypted).not.toBe("123456");
    expect(encrypted).not.toContain("123456");
    expect(isEncryptedValue(encrypted)).toBe(true);
  });

  it("passes through empty values", () => {
    expect(encryptValue("")).toBe("");
    expect(encryptValue(null)).toBe(null);
  });

  it("does not treat plaintext as ciphertext", () => {
    expect(isEncryptedValue("secret-password")).toBe(false);
  });

  it("does not re-encrypt an already encrypted value", () => {
    const encrypted = encryptValue("123456");
    expect(encryptValue(encrypted)).toBe(encrypted);
  });
});
