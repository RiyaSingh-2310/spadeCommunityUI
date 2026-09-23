import { describe, expect, it } from "vitest";
import {
  isDefaultPartnerRecord,
  mappingRowsIncludePartner,
  pickDefaultPartnerFromList,
  resolveDefaultPartnerQuota,
  resolvePartnerId,
} from "./defaultPartnerMapping";

describe("defaultPartnerMapping", () => {
  it("detects backend default partner flags", () => {
    expect(isDefaultPartnerRecord({ is_default: true })).toBe(true);
    expect(isDefaultPartnerRecord({ isDefaultPartner: 1 })).toBe(true);
    expect(isDefaultPartnerRecord({ partner_type: "complete_terminate" })).toBe(
      true
    );
    expect(isDefaultPartnerRecord({ name: "Acme" })).toBe(false);
  });

  it("picks the first default partner from a list", () => {
    const partners = [
      { id: 1, name: "A" },
      { id: 2, name: "Portal", is_default: true },
      { id: 3, name: "B", is_default: true },
    ];
    expect(pickDefaultPartnerFromList(partners)?.id).toBe(2);
    expect(pickDefaultPartnerFromList([])).toBeNull();
  });

  it("resolves full sample size as default quota", () => {
    expect(resolveDefaultPartnerQuota(2400)).toBe("2400");
    expect(resolveDefaultPartnerQuota(null)).toBe("");
    expect(resolveDefaultPartnerQuota(0)).toBe("");
  });

  it("checks whether a partner is already mapped", () => {
    expect(
      mappingRowsIncludePartner([{ partnerId: "12" }, { partnerId: 9 }], "12")
    ).toBe(true);
    expect(mappingRowsIncludePartner([{ partnerId: "9" }], "12")).toBe(false);
    expect(resolvePartnerId({ partner_id: 44 })).toBe("44");
  });
});
