import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PRODUCTION_SERVICES = [
  "src/modules/survey/services/surveyApi.js",
  "src/modules/survey/services/projectUrlsApi.js",
  "src/modules/survey/services/preScreenApi.js",
  "src/modules/public-survey/services/doSurveyApi.js",
  "src/modules/community-users/services/communityUsersApi.js",
  "src/modules/system-email/services/systemEmailsApi.js",
  "src/services/screening/screeningQuestionsApi.js",
];

describe("production services do not use mock fallbacks", () => {
  it.each(PRODUCTION_SERVICES)("%s does not import mock stores", (file) => {
    const source = readFileSync(file, "utf8");
    expect(source).not.toMatch(/mockSurveyStore|mockProjectUrlsData|communityUsersStore|USE_SURVEY_MOCK_DATA|USE_PROJECT_URLS_MOCK/);
    expect(source).not.toMatch(/localhost:5050/);
  });
});
