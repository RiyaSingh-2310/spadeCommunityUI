import { describe, expect, it } from "vitest";
import { encryptValue, isEncryptedValue } from "./encryption";

describe("encryptValue", () => {
  it("does not encrypt passwords with frontend secrets", () => {
    expect(encryptValue("secret-password")).toBe("secret-password");
  });

  it("passes through empty values", () => {
    expect(encryptValue("")).toBe("");
    expect(encryptValue(null)).toBe(null);
  });

  it("does not treat plaintext as ciphertext", () => {
    expect(isEncryptedValue("secret-password")).toBe(false);
  });
});
