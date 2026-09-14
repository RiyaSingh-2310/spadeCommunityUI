import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../../services/auth/loginRole", () => ({
  isPartnerLoginRole: vi.fn(() => false),
}));

import { apiRequest } from "../../../services/api/client";
import { isPartnerLoginRole } from "../../../services/auth/loginRole";
import { listMySupplierMappings, listSupplierMappings } from "./supplierMappingApi";

describe("listSupplierMappings", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
    vi.mocked(isPartnerLoginRole).mockReturnValue(false);
  });

  it("uses GET /api/supplier-mapping/list for admin with projectid and partnerid", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      success: true,
      data: [{ id: 1, projectid: "10", partnerid: "2" }],
    });

    const rows = await listSupplierMappings({
      projectId: "10",
      partnerId: "2",
    });

    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/api/supplier-mapping/list?"),
      { method: "GET" }
    );
    const url = vi.mocked(apiRequest).mock.calls[0][0];
    expect(url).toContain("projectid=10");
    expect(url).toContain("partnerid=2");
    expect(url).not.toContain("my-mappings");
    expect(rows).toHaveLength(1);
  });

  it("uses GET /api/supplier-mapping/my-mappings for partner login without partnerid", async () => {
    vi.mocked(isPartnerLoginRole).mockReturnValue(true);
    vi.mocked(apiRequest).mockResolvedValue({
      success: true,
      data: [
        { id: 1, projectid: "10", projectUrlId: "u1" },
        { id: 2, projectid: "11", projectUrlId: "u2" },
      ],
      total: 2,
      page: 1,
      limit: 10,
    });

    const rows = await listSupplierMappings({
      projectId: "10",
      partnerId: "should-not-be-sent",
    });

    expect(apiRequest).toHaveBeenCalledTimes(1);
    const url = vi.mocked(apiRequest).mock.calls[0][0];
    expect(url).toMatch(/^\/api\/supplier-mapping\/my-mappings\?/);
    expect(url).toContain("page=1");
    expect(url).toContain("limit=");
    expect(url).not.toContain("partnerid");
    expect(url).not.toContain("projectid");
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(1);
  });
});

describe("listMySupplierMappings", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("extracts nested mapping arrays", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      success: true,
      data: { mappings: [{ id: 9, projectid: "1" }] },
    });

    const rows = await listMySupplierMappings();
    expect(rows).toEqual([{ id: 9, projectid: "1" }]);
  });
});
