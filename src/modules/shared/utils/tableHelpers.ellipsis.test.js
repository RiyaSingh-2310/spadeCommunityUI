import { describe, expect, it } from "vitest";
import {
  getColumnEllipsisMaxWidthPx,
  getColumnKey,
  getRowValue,
} from "./tableHelpers";

describe("listing column ellipsis widths", () => {
  it("maps Group Title to the survey title field", () => {
    expect(getColumnKey("Group Title")).toBe("surveyTitle");
    expect(getRowValue({ surveyTitle: "Nederlandse introductie (DUTCH)" }, "Group Title")).toBe(
      "Nederlandse introductie (DUTCH)"
    );
  });

  it("uses 250px for titles and email subjects", () => {
    expect(getColumnEllipsisMaxWidthPx("Group Title")).toBe(250);
    expect(getColumnEllipsisMaxWidthPx("Title")).toBe(250);
    expect(getColumnEllipsisMaxWidthPx("Email Subject")).toBe(250);
  });

  it("uses 200px for Right Answer and email address", () => {
    expect(getColumnEllipsisMaxWidthPx("Right Answer")).toBe(200);
    expect(getColumnEllipsisMaxWidthPx("Email Address")).toBe(200);
  });

  it("does not ellipsize status, serial, or action columns", () => {
    expect(getColumnEllipsisMaxWidthPx("Status")).toBeNull();
    expect(getColumnEllipsisMaxWidthPx("S.No")).toBeNull();
    expect(getColumnEllipsisMaxWidthPx("Action")).toBeNull();
  });
});
