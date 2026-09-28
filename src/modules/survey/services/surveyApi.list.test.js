import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/client";
import { getRecords } from "./surveyApi";

function listResponse(projects, { page = 1, limit = 10, total = projects.length } = {}) {
  return {
    success: true,
    data: projects,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

describe("getRecords project status filter", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("sends status=active with pagination and returns every row from the API", async () => {
    vi.mocked(apiRequest).mockResolvedValue(
      listResponse(
        [
          { id: 22, Project_Name: "Active Project", Status: "active" },
          { id: 9, Project_Name: "Also Active", Status: "active" },
        ],
        { total: 22, totalPages: 3 }
      )
    );

    const result = await getRecords({ page: 1, limit: 10, status: "active" });
    const url = String(vi.mocked(apiRequest).mock.calls[0][0]);
    const params = new URL(url, "http://localhost").searchParams;

    expect(url).toContain("/api/projects/list?");
    expect(params.get("status")).toBe("active");
    expect(params.get("page")).toBe("1");
    expect(params.get("limit")).toBe("10");
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(22);
    expect(result.totalPages).toBe(3);
  });

  it("sends status=inactive and does not drop an empty API payload", async () => {
    vi.mocked(apiRequest).mockResolvedValue(listResponse([], { total: 0 }));

    const result = await getRecords({ page: 1, limit: 10, status: "Inactive" });
    const url = String(vi.mocked(apiRequest).mock.calls[0][0]);

    expect(new URL(url, "http://localhost").searchParams.get("status")).toBe("inactive");
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("resets callers to page 1 by accepting the requested page with the new status", async () => {
    vi.mocked(apiRequest).mockResolvedValue(
      listResponse([{ id: 3, Project_Name: "Paged", Status: "inactive" }], {
        page: 1,
        total: 1,
      })
    );

    await getRecords({ page: 1, limit: 10, status: "inactive", search: "Paged" });
    const params = new URL(
      String(vi.mocked(apiRequest).mock.calls[0][0]),
      "http://localhost"
    ).searchParams;

    expect(params.get("status")).toBe("inactive");
    expect(params.get("page")).toBe("1");
    expect(params.get("search")).toBe("Paged");
  });

  it("omits status when the caller does not request a status filter", async () => {
    vi.mocked(apiRequest).mockResolvedValue(
      listResponse([{ id: 1, Project_Name: "Any", Status: "active" }])
    );

    await getRecords({ page: 2, limit: 10 });
    const params = new URL(
      String(vi.mocked(apiRequest).mock.calls[0][0]),
      "http://localhost"
    ).searchParams;

    expect(params.get("page")).toBe("2");
    expect(params.has("status")).toBe(false);
  });
});
