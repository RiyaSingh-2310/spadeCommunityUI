import { describe, expect, it } from "vitest";
import {
  extractListItemsFromResponse,
  extractListTotalFromResponse,
  resolveListingPagination,
} from "./listResponse";

describe("extractListTotalFromResponse", () => {
  it("prefers total over page-sized count", () => {
    expect(extractListTotalFromResponse({ total: 11, count: 10 }, 10)).toBe(11);
  });

  it("falls back to the current page length", () => {
    expect(extractListTotalFromResponse({}, 10)).toBe(10);
  });
});

describe("extractListItemsFromResponse", () => {
  it("reads admin rows from data[] without treating the array as a nested object", () => {
    const items = extractListItemsFromResponse({
      success: true,
      data: [{ id: 99, name: "User Admin" }],
      total: 11,
      page: 2,
      limit: 10,
      totalPages: 2,
    });
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(99);
  });
});

describe("resolveListingPagination", () => {
  it("creates two pages for 11 entries at limit 10", () => {
    const page1 = resolveListingPagination({
      data: { total: 11, page: 1, limit: 10 },
      itemCount: 10,
      requestedPage: 1,
      requestedLimit: 10,
    });
    expect(page1).toMatchObject({ total: 11, totalPages: 2, page: 1 });

    const page2 = resolveListingPagination({
      data: { total: 11, page: 2, limit: 10 },
      itemCount: 1,
      requestedPage: 2,
      requestedLimit: 10,
      previousTotal: 11,
    });
    expect(page2).toMatchObject({ total: 11, totalPages: 2, page: 2 });
  });

  it("does not treat page-sized count as the full total when totalPages is 2", () => {
    const resolved = resolveListingPagination({
      data: { count: 10, totalPages: 2, page: 1, limit: 10 },
      itemCount: 10,
      requestedPage: 1,
      requestedLimit: 10,
    });
    expect(resolved.totalPages).toBe(2);
    expect(resolved.total).toBeGreaterThanOrEqual(11);
  });

  it("uses API total and totalPages as the source of truth", () => {
    const resolved = resolveListingPagination({
      data: { total: 11, page: 2, limit: 10, totalPages: 2, data: [{}] },
      itemCount: 1,
      requestedPage: 2,
      requestedLimit: 10,
    });
    expect(resolved).toMatchObject({ total: 11, totalPages: 2, page: 2 });
  });

  it("collapses to one page when the limit grows to 25", () => {
    const resolved = resolveListingPagination({
      data: { total: 11, page: 1, limit: 25 },
      itemCount: 11,
      requestedPage: 1,
      requestedLimit: 25,
    });
    expect(resolved.totalPages).toBe(1);
    expect(resolved.total).toBe(11);
  });

  it("uses a single disabled-page state for 0 entries", () => {
    const resolved = resolveListingPagination({
      data: { total: 0 },
      itemCount: 0,
      requestedPage: 1,
      requestedLimit: 10,
    });
    expect(resolved.total).toBe(0);
    expect(resolved.totalPages).toBe(1);
  });
});
