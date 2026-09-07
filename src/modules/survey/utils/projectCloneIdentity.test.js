import { describe, expect, it } from "vitest";
import {
  nextUniqueCloneProjectCode,
  nextUniqueCloneProjectName,
  stripCloneNameSuffix,
} from "./projectCloneIdentity";

describe("nextUniqueCloneProjectName", () => {
  it("appends - 1 when the original name is unused as a clone", () => {
    expect(nextUniqueCloneProjectName("Lifestyle Survey", ["Lifestyle Survey"])).toBe(
      "Lifestyle Survey - 1"
    );
  });

  it("increments past existing clone suffixes", () => {
    expect(
      nextUniqueCloneProjectName("Lifestyle Survey", [
        "Lifestyle Survey",
        "Lifestyle Survey - 1",
        "Lifestyle Survey - 2",
      ])
    ).toBe("Lifestyle Survey - 3");
  });

  it("uses the stem when cloning an already-suffixed name", () => {
    expect(
      nextUniqueCloneProjectName("Lifestyle Survey - 1", [
        "Lifestyle Survey",
        "Lifestyle Survey - 1",
      ])
    ).toBe("Lifestyle Survey - 2");
  });
});

describe("stripCloneNameSuffix", () => {
  it("removes a trailing numeric clone suffix", () => {
    expect(stripCloneNameSuffix("Lifestyle Survey - 3")).toBe("Lifestyle Survey");
  });
});

describe("nextUniqueCloneProjectCode", () => {
  it("does not reuse the source project code", () => {
    expect(nextUniqueCloneProjectCode("ABC123", ["ABC123"])).toBe("ABC123-1");
  });

  it("increments until the code is unused", () => {
    expect(nextUniqueCloneProjectCode("ABC123", ["ABC123", "ABC123-1"])).toBe("ABC123-2");
  });
});
