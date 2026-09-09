import { describe, expect, it } from "vitest";
import { normalizeProjectUrlStatus } from "../utils/projectUrlFormValidation";
import {
  appendIsTestToPartnerUrl,
  mapSupplierMappingToRow,
  resolvePartnerUrlForCurrentApp,
} from "./supplierMappingApi";

describe("Partner URL display", () => {
  it("keeps the API Partner URL instead of rewriting the host", () => {
    const apiUrl =
      "https://partner-host.example/dosurvey/abc123?pid=SFS363&uid=identifier";

    expect(resolvePartnerUrlForCurrentApp(apiUrl)).toBe(apiUrl);
    expect(mapSupplierMappingToRow({ dynamic_url: apiUrl }).partnerUrl).toBe(
      apiUrl
    );
  });

  it("appends IsTest without changing the API host", () => {
    const apiUrl = "https://partner-host.example/dosurvey/abc123";
    expect(appendIsTestToPartnerUrl(apiUrl, true)).toBe(
      `${apiUrl}?IsTest=1`
    );
    expect(appendIsTestToPartnerUrl(apiUrl, false)).toBe(
      `${apiUrl}?IsTest=0`
    );
  });
});

describe("normalizeProjectUrlStatus", () => {
  it("persists Open and Closed from API values", () => {
    expect(normalizeProjectUrlStatus("Open")).toBe("Open");
    expect(normalizeProjectUrlStatus("Closed")).toBe("Closed");
    expect(normalizeProjectUrlStatus("close")).toBe("Closed");
    expect(normalizeProjectUrlStatus("inactive")).toBe("Closed");
    expect(normalizeProjectUrlStatus("active")).toBe("Open");
    expect(normalizeProjectUrlStatus("On Hold")).toBe("On Hold");
  });
});
