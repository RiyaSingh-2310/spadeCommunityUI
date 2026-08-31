import { describe, expect, it } from "vitest";
import {
  getVisibleEntryCount,
  listingTotalAfterExcludingCurrentUser,
} from "./pagination";

describe("listingTotalAfterExcludingCurrentUser", () => {
  it("subtracts the hidden current user from the API total", () => {
    expect(listingTotalAfterExcludingCurrentUser(4, 1)).toBe(3);
  });

  it("leaves the total unchanged when nobody was excluded", () => {
    expect(listingTotalAfterExcludingCurrentUser(4, 0)).toBe(4);
  });
});

describe("getVisibleEntryCount", () => {
  it("matches remaining rows on a single page", () => {
    expect(getVisibleEntryCount(1, 10, 3)).toBe(3);
  });
});
