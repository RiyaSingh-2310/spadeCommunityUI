import { describe, expect, it } from "vitest";
import { mapProjectReportRow, mapPrescreenReportRow } from "./projectReportApi";

describe("mapProjectReportRow", () => {
  it("maps Supplier Identifier onto UID", () => {
    const row = mapProjectReportRow({
      supplier_id: 1,
      supplier_name: "Supplier 1",
      client_id: "C-9",
      "Supplier Identifier": "4534sddfs",
      status: "complete",
      is_test: 0,
      device: "Desktop",
      reason: "Qualified",
    });
    expect(row.uid).toBe("4534sddfs");
    expect(row.device).toBe("Desktop");
    expect(row.reason).toBe("Qualified");
    expect(row.isTestLink).toBe("false");
  });

  it("falls back to uid when Supplier Identifier is missing", () => {
    const row = mapProjectReportRow({
      uid: "uid-only",
      is_test: 1,
    });
    expect(row.uid).toBe("uid-only");
    expect(row.isTestLink).toBe("true");
  });
});

describe("mapPrescreenReportRow", () => {
  it("maps Supplier Identifier onto UID and keeps existing fields", () => {
    const row = mapPrescreenReportRow({
      supplier_identifier: "ps-uid-1",
      supplier_name: "Partner A",
      vendor_id: "V-2",
      client_id: "C-3",
      ip: "1.2.3.4",
      question: "Age?",
      answer: "18+",
    });
    expect(row.uid).toBe("ps-uid-1");
    expect(row.supplierName).toBe("Partner A");
    expect(row.vendorId).toBe("V-2");
    expect(row.clientId).toBe("C-3");
    expect(row.ip).toBe("1.2.3.4");
    expect(row.question).toBe("Age?");
    expect(row.answer).toBe("18+");
  });
});
