import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import QuestionnaireGroupListFilters from "../../modules/prescreen/components/QuestionnaireGroupListFilters";
import PreScreenerGroupFormPage from "../../modules/survey-research/pages/PreScreenerGroupFormPage";
import CountrySelect from "./CountrySelect";

const API_LANGUAGES = [
  "Arabic",
  "Chinese",
  "Dutch",
  "English",
  "French",
  "German",
  "Hindi",
  "Italian",
  "Japanese",
  "Korean",
  "Russian",
  "Spanish",
];

vi.mock("../../modules/shared/hooks/useLanguages", () => ({
  useLanguages: () => ({
    languages: API_LANGUAGES,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../modules/shared/hooks/useCountries", () => ({
  useCountries: () => ({
    countries: [
      { name: "Brazil", code: "BR", dialCode: "+55" },
      { name: "India", code: "IN", dialCode: "+91" },
      { name: "Japan", code: "JP", dialCode: "+81" },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe("language dropdowns", () => {
  it("lists every catalog language on the questionnaire group filter", () => {
    const { getByLabelText } = render(
      <QuestionnaireGroupListFilters
        status="all"
        language="all"
        extraLanguages={["dutch", "korean"]}
      />
    );

    const select = getByLabelText("Filter by language");
    const values = [...select.options].map((option) => option.value);
    expect(values[0]).toBe("all");
    API_LANGUAGES.forEach((language) => {
      expect(values).toContain(language.toLowerCase());
    });
  });

  it("lists every catalog language on the research pre-screener form", () => {
    const { getByRole } = render(
      <MemoryRouter>
        <PreScreenerGroupFormPage />
      </MemoryRouter>
    );

    const select = getByRole("combobox", { name: "Language" });
    const labels = [...select.options].map((option) => option.text);
    expect(labels).toEqual(API_LANGUAGES);
  });
});

describe("CountrySelect", () => {
  it("shows every country from the countries source, including one outside a short preset list", () => {
    const { getByLabelText, getAllByRole } = render(
      <CountrySelect value="Atlantis" onChange={() => {}} />
    );

    fireEvent.click(getByLabelText("Select country"));
    const labels = getAllByRole("option").map((option) => option.textContent);
    expect(labels).toEqual([
      "Atlantis",
      "Brazil (+55)",
      "India (+91)",
      "Japan (+81)",
    ]);
  });
});
