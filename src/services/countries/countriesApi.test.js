import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../api/client";
import { clearCountriesCache, getCountries } from "./countriesApi";

describe("getCountries", () => {
  beforeEach(() => {
    clearCountriesCache();
    apiRequest.mockReset();
  });

  it("returns every country from GET /api/countries/list", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      count: 3,
      data: [
        { country_id: 1, name: "Afghanistan", calling_code: null },
        { country_id: 101, name: "India", calling_code: null },
        { country_id: 231, name: "United States", calling_code: null },
      ],
    });

    const countries = await getCountries();

    expect(apiRequest).toHaveBeenCalledWith("/api/countries/list");
    expect(countries.map((country) => country.name)).toEqual([
      "Afghanistan",
      "India",
      "United States",
    ]);
    expect(countries.map((country) => country.id)).toEqual([1, 101, 231]);
  });

  it("reuses the cached list", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: [{ country_id: 101, name: "India", calling_code: null }],
    });

    await getCountries();
    await getCountries();

    expect(apiRequest).toHaveBeenCalledTimes(1);
  });
});
