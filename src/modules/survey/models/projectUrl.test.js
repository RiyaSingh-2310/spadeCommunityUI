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

  it("keeps Closed status from the Project URL record without falling back to Open", () => {
    const model = normalizeProjectUrl(
      {
        url_id: 7,
        Status: "Closed",
      },
      3
    );
    expect(model.status).toBe("Closed");
  });

  it("maps inactive Project URL status to Closed", () => {
    const model = normalizeProjectUrl(
      {
        url_id: 8,
        url_status: "inactive",
      },
      3
    );
    expect(model.status).toBe("Closed");
  });

  it("does not use the parent project status when the URL status is missing", () => {
    const model = normalizeProjectUrl(
      {
        url_id: 9,
        project_url_code: "XYZ",
      },
      3,
      { Status: "Closed", status: "inactive" }
    );
    expect(model.status).toBe("Open");
  });

  it("returns an empty model for missing records", () => {
    expect(normalizeProjectUrl(null, "9")).toEqual(createEmptyProjectUrlForm("9"));
  });

  it("maps IR, CPI, LOI, and reward points from mixed field aliases", () => {
    const model = normalizeProjectUrl(
      {
        id: 5,
        projectUrlCode: "CODE1",
        CPI: 3.1,
        IR: 45,
        LOI: 12,
        CompletionPoint: 20,
        TerminationPoint: 5,
      },
      17
    );

    expect(model.cpiRate).toBe("3.1");
    expect(model.ir).toBe("45");
    expect(model.loi).toBe("12");
    expect(model.completeRewardPoints).toBe("20");
    expect(model.terminationRewardPoints).toBe("5");
    expect(model.projectUrlCode).toBe("CODE1");
  });

  it("maps CPI and IR aliases on already-normalized list rows", () => {
    const model = normalizeProjectUrl(
      {
        id: "11",
        projectUrlCode: "LISTROW",
        CPI: 2,
        IR: 30,
        loi: 8,
        completeRewardPoints: 15,
        terminationRewardPoints: 3,
      },
      "9"
    );

    expect(model.cpiRate).toBe("2");
    expect(model.ir).toBe("30");
    expect(model.loi).toBe("8");
    expect(model.completeRewardPoints).toBe("15");
    expect(model.terminationRewardPoints).toBe("3");
  });
});
