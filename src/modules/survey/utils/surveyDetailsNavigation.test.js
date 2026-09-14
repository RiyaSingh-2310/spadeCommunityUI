import { describe, expect, it } from "vitest";
import { getSurveyDetailTabs } from "../components/SurveyDetailsHeader";
import { SURVEY_DETAIL_TAB_IDS } from "./surveyDetailsNavigation";

describe("getSurveyDetailTabs", () => {
  it("keeps Admin/Sales/Manager project tabs", () => {
    expect(getSurveyDetailTabs().map((tab) => tab.id)).toEqual([
      SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS,
      SURVEY_DETAIL_TAB_IDS.PROJECT_URLS,
      SURVEY_DETAIL_TAB_IDS.PARTNER_MAPPING,
    ]);
  });

  it("uses Partner Information and Project Report for Partner login", () => {
    expect(getSurveyDetailTabs({ partnerView: true }).map((tab) => tab.id)).toEqual([
      SURVEY_DETAIL_TAB_IDS.PARTNER_INFORMATION,
      SURVEY_DETAIL_TAB_IDS.PROJECT_REPORT,
    ]);
  });
});
