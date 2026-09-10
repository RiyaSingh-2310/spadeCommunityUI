import { describe, expect, it } from "vitest";
import { mapProjectReportRow } from "./projectReportApi";

describe("mapProjectReportRow", () => {
  it("maps respondent UID instead of supplier identifier", () => {
    const row = mapProjectReportRow({
      supplier_id: 1,
      supplier_name: "Supplier 1",
      client_id: "C-9",
      uid: "4534sddfs",
      status: "complete",
      is_test: 0,
    });
    expect(row.uid).toBe("4534sddfs");
    expect(row.supplierIdentifier).toBeUndefined();
    expect(row.isTestLink).toBe("false");
  });
});
