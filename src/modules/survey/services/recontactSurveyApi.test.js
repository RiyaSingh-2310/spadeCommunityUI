import { describe, expect, it } from "vitest";
import { mapPartnersToSupplierDetailRows } from "../services/recontactSurveyApi";

describe("mapPartnersToSupplierDetailRows", () => {
  it("maps GET /api/projects/:id/partners rows into the supplier details table", () => {
    const rows = mapPartnersToSupplierDetailRows([
      {
        s_no: 1,
        supplier_id: 13,
        supplier_code: "P016",
        supplier_name: "Partner For Client",
        quota: 12,
        total_respondent: 3,
        complete: 0,
        terminate: 0,
        over_quota: 0,
        quality_term: 0,
        dropout: 0,
      },
    ]);

    expect(rows).toEqual([
      {
        sno: 1,
        supplierId: 13,
        supplierCode: "P016",
        supplierName: "Partner For Client",
        quota: 12,
        totalRespondent: 3,
        complete: 0,
        terminate: 0,
        overQuota: 0,
        qualityTerm: 0,
        dropout: 0,
      },
    ]);
  });
});
