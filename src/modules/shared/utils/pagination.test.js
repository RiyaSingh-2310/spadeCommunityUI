import { describe, expect, it } from "vitest";
import {
  clampPage,
  getEntryRange,
  getTotalPages,
  getVisibleEntryCount,
  listingTotalAfterExcludingCurrentUser,
  paginateItems,
} from "./pagination";

describe("getTotalPages", () => {
  it("uses one page for empty lists", () => {
    expect(getTotalPages(0, 10)).toBe(1);
  });

  it("fits 1 and 10 items on a single page of 10", () => {
    expect(getTotalPages(1, 10)).toBe(1);
    expect(getTotalPages(10, 10)).toBe(1);
  });

  it("opens a second page for 11 and 21 items at limit 10", () => {
    expect(getTotalPages(11, 10)).toBe(2);
    expect(getTotalPages(20, 10)).toBe(2);
    expect(getTotalPages(21, 10)).toBe(3);
  });

  it("fits 11 items on one page when the limit is 25", () => {
    expect(getTotalPages(11, 25)).toBe(1);
  });

  it("recalculates for 10, 25, 50, and 100", () => {
    expect(getTotalPages(100, 10)).toBe(10);
    expect(getTotalPages(100, 25)).toBe(4);
    expect(getTotalPages(100, 50)).toBe(2);
    expect(getTotalPages(100, 100)).toBe(1);
  });
});

describe("clampPage", () => {
  it("never stays above the last valid page", () => {
    expect(clampPage(5, 2)).toBe(2);
    expect(clampPage(0, 3)).toBe(1);
  });
});

describe("paginateItems", () => {
  const items = Array.from({ length: 11 }, (_, i) => i + 1);

  it("puts the remainder on page 2 when limit is 10", () => {
    expect(paginateItems(items, 1, 10).items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(paginateItems(items, 2, 10).items).toEqual([11]);
    expect(paginateItems(items, 2, 10).totalPages).toBe(2);
  });

  it("does not create an empty extra page", () => {
    expect(paginateItems(items, 3, 10).currentPage).toBe(2);
    expect(paginateItems(items, 3, 10).items).toEqual([11]);
  });

  it("shows every item on one page after increasing the limit", () => {
    const page = paginateItems(items, 2, 25);
    expect(page.currentPage).toBe(1);
    expect(page.totalPages).toBe(1);
    expect(page.items).toHaveLength(11);
  });
});

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

  it("matches 11 entries with limit 10", () => {
    expect(getVisibleEntryCount(1, 10, 11)).toBe(10);
    expect(getVisibleEntryCount(2, 10, 11)).toBe(1);
  });

  it("matches 20 and 21 entries with limit 10", () => {
    expect(getVisibleEntryCount(2, 10, 20)).toBe(10);
    expect(getVisibleEntryCount(3, 10, 21)).toBe(1);
  });

  it("matches 11 entries with limit 25", () => {
    expect(getVisibleEntryCount(1, 25, 11)).toBe(11);
  });

  it("returns 0 for empty lists", () => {
    expect(getVisibleEntryCount(1, 10, 0)).toBe(0);
  });
});

describe("getEntryRange", () => {
  it("uses the API range formula", () => {
    expect(getEntryRange(1, 10, 11)).toEqual({ start: 1, end: 10 });
    expect(getEntryRange(2, 10, 11)).toEqual({ start: 11, end: 11 });
    expect(getEntryRange(1, 10, 7)).toEqual({ start: 1, end: 7 });
    expect(getEntryRange(1, 25, 11)).toEqual({ start: 1, end: 11 });
    expect(getEntryRange(1, 10, 0)).toEqual({ start: 0, end: 0 });
  });
});
