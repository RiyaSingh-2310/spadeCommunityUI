import { describe, expect, it } from "vitest";
import {
  isDefaultPartnerMappingRow,
  isDefaultPartnerRecord,
  mappingRowsIncludePartner,
  pickDefaultPartnerFromList,
  resolveDefaultPartnerQuota,
  resolvePartnerId,
  shouldShowAddPartnerButton,
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

  it("detects default partner by name heuristics", () => {
    expect(
      isDefaultPartnerRecord({ id: 9, name: "Spade Community Portal" })
    ).toBe(true);
    expect(
      isDefaultPartnerRecord({ id: 9, name: "Complete Terminate Partner" })
    ).toBe(true);
    expect(isDefaultPartnerRecord({ id: 9, name: "Default Partner" })).toBe(
      true
    );
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

  it("falls back to the sole partner when no flag is present", () => {
    expect(
      pickDefaultPartnerFromList([{ id: 44, name: "Only Partner" }])?.id
    ).toBe(44);
    expect(
      pickDefaultPartnerFromList([
        { id: 1, name: "A" },
        { id: 2, name: "B" },
      ])
    ).toBeNull();
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

  it("identifies default mapping rows without relying on list position", () => {
    expect(
      isDefaultPartnerMappingRow(
        { partnerId: "7", partnerName: "Acme", isDefault: false },
        "7"
      )
    ).toBe(true);
    expect(
      isDefaultPartnerMappingRow({
        partnerId: "3",
        partnerName: "Spade Community Portal",
      })
    ).toBe(true);
    expect(
      isDefaultPartnerMappingRow(
        { partnerId: "9", partnerName: "Other Supplier" },
        "7"
      )
    ).toBe(false);
  });

  it("hides Add Partner when remaining quota is exhausted", () => {
    expect(
      shouldShowAddPartnerButton({
        allowWrite: true,
        hasProjectUrl: true,
        urlEligible: true,
        isLoadingStats: false,
        addPartnerFlag: true,
        remainingQuota: 0,
        availableQuota: 0,
      })
    ).toBe(false);

    expect(
      shouldShowAddPartnerButton({
        allowWrite: true,
        hasProjectUrl: true,
        urlEligible: true,
        isLoadingStats: false,
        addPartnerFlag: true,
        remainingQuota: 100,
        availableQuota: 100,
      })
    ).toBe(true);
  });
});
