import { describe, expect, it } from "vitest";
import { createEmptyProjectUrlForm, normalizeProjectUrl } from "../services/projectUrlsApi";

describe("normalizeProjectUrl", () => {
  it("maps API urlInfo fields into one frontend model", () => {
    const model = normalizeProjectUrl(
      {
        url_id: 42,
        project_id: 17,
        project_url_code: "ABC123",
        Status: "Open",
        country: "India",
        Language: "English",
        CPI: 2.5,
        "LOI(Minute)": 12,
        Live_Link: "https://example.com/live",
        Test_Link: "https://example.com/test",
        SampleSize: 200,
        Project_Link_Type: "SingleLink",
      },
      17
    );

    expect(model.id).toBe("42");
    expect(model.projectId).toBe("17");
    expect(model.projectUrlCode).toBe("ABC123");
    expect(model.status).toBe("Open");
    expect(model.country).toBe("India");
    expect(model.language).toBe("English");
    expect(model.cpiRate).toBe("2.5");
    expect(model.loi).toBe("12");
    expect(model.liveLink).toBe("https://example.com/live");
    expect(model.testLink).toBe("https://example.com/test");
    expect(model.sampleSize).toBe("200");
  });

  it("returns an empty model for missing records", () => {
    expect(normalizeProjectUrl(null, "9")).toEqual(createEmptyProjectUrlForm("9"));
  });
});
