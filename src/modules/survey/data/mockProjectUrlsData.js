/**
 * Temporary Project URLs mock data.
 * Easy to swap for real API integration later.
 */

export const PROJECT_URL_STATUS_OPTIONS = ["Open", "Closed", "On Hold"];

export const PROJECT_URL_COUNTRY_OPTIONS = [
  "United States",
  "United Kingdom",
  "India",
  "Germany",
  "Japan",
  "Canada",
  "Australia",
  "France",
];

export const PROJECT_URL_LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Japanese",
  "German",
  "French",
  "Spanish",
  "Arabic",
];

/** Dummy pre-screeners keyed by country + language. */
export const MOCK_PRE_SCREENERS = [
  {
    id: "ps-en-basic",
    label: "English Basic",
    country: "United States",
    language: "English",
  },
  {
    id: "ps-en-it",
    label: "English IT",
    country: "United States",
    language: "English",
  },
  {
    id: "ps-en-health",
    label: "English Healthcare",
    country: "United Kingdom",
    language: "English",
  },
  {
    id: "ps-en-ca",
    label: "English Consumer",
    country: "Canada",
    language: "English",
  },
  {
    id: "ps-hi-general",
    label: "Hindi General",
    country: "India",
    language: "Hindi",
  },
  {
    id: "ps-hi-banking",
    label: "Hindi Banking",
    country: "India",
    language: "Hindi",
  },
  {
    id: "ps-en-in",
    label: "English India General",
    country: "India",
    language: "English",
  },
  {
    id: "ps-jp-mobile",
    label: "Japanese Mobile",
    country: "Japan",
    language: "Japanese",
  },
  {
    id: "ps-de-auto",
    label: "German Automotive",
    country: "Germany",
    language: "German",
  },
  {
    id: "ps-fr-retail",
    label: "French Retail",
    country: "France",
    language: "French",
  },
  {
    id: "ps-es-travel",
    label: "Spanish Travel",
    country: "Australia",
    language: "Spanish",
  },
  {
    id: "ps-ar-basic",
    label: "Arabic Basic",
    country: "United Kingdom",
    language: "Arabic",
  },
];

function createProjectUrlSeed(projectId, index) {
  const countries = PROJECT_URL_COUNTRY_OPTIONS;
  const languages = PROJECT_URL_LANGUAGE_OPTIONS;
  const country = countries[index % countries.length];
  const language =
    country === "India"
      ? index % 2 === 0
        ? "Hindi"
        : "English"
      : country === "Japan"
        ? "Japanese"
        : country === "Germany"
          ? "German"
          : country === "France"
            ? "French"
            : "English";

  const matched =
    MOCK_PRE_SCREENERS.find(
      (item) => item.country === country && item.language === language
    ) ?? MOCK_PRE_SCREENERS[0];

  const statuses = PROJECT_URL_STATUS_OPTIONS;

  return {
    id: index + 1,
    projectId: Number(projectId) || projectId,
    clientProjectId: `CLIENT-PRJ-${String(1000 + Number(projectId || index + 1)).padStart(4, "0")}`,
    clientUrl: `https://client.example.com/projects/${projectId || index + 1}`,
    discussion: `Kick-off notes for project ${projectId || index + 1}. Align sample specs and go-live window.`,
    loi: Number((8 + (index % 5) * 1.5).toFixed(1)),
    ir: Number((20 + (index % 6) * 4.5).toFixed(1)),
    country,
    language,
    cpiRate: Number((1.75 + (index % 4) * 0.4).toFixed(2)),
    sampleSize: 400 + index * 50,
    startDate: `2026-0${1 + (index % 6)}-05`,
    endDate: `2026-0${2 + (index % 6)}-25`,
    status: index === 0 ? "Open" : statuses[index % statuses.length],
    testLink: `https://speed-community.com/survey/test/${projectId || index + 1}`,
    liveLink: `https://speed-community.com/survey/live/${projectId || index + 1}`,
    geoLocation: index % 2 === 0,
    urlProtection: true,
    uniqueIp: index % 3 === 0,
    fraudDetection: index % 2 !== 0,
    preScreenerId: matched.id,
    completeRewardPoints: 40 + index * 5,
    validateRewardPoints: 8 + (index % 4) * 2,
    addedBy: "Admin User",
    addedOn: "01 Jan 2026, 10:15 AM",
    updatedBy: "Priya Desai",
    updatedOn: "12 Mar 2026, 02:40 PM",
    deletedBy: "",
    deletedOn: "",
  };
}

/** Mutable Project URL store keyed loosely by project/survey id. */
let projectUrlRecords = Array.from({ length: 12 }, (_, index) =>
  createProjectUrlSeed(index + 1, index)
);

export function getMockPreScreeners({ country = "", language = "" } = {}) {
  const countryKey = String(country ?? "").trim().toLowerCase();
  const languageKey = String(language ?? "").trim().toLowerCase();

  return MOCK_PRE_SCREENERS.filter((item) => {
    const countryOk =
      !countryKey || String(item.country).toLowerCase() === countryKey;
    const languageOk =
      !languageKey || String(item.language).toLowerCase() === languageKey;
    return countryOk && languageOk;
  }).map((item) => ({
    value: item.id,
    label: item.label,
  }));
}

export function getMockProjectUrlByProjectId(projectId) {
  const target = String(projectId ?? "").trim();
  if (!target) return null;

  const found = projectUrlRecords.find(
    (row) => String(row.projectId) === target || String(row.id) === target
  );

  if (found) return { ...found };

  // Create a default Open record for unknown project ids so View always works.
  const seeded = createProjectUrlSeed(target, projectUrlRecords.length);
  seeded.status = "Open";
  projectUrlRecords = [...projectUrlRecords, seeded];
  return { ...seeded };
}

export function updateMockProjectUrl(projectId, patch = {}) {
  const target = String(projectId ?? "").trim();
  let index = projectUrlRecords.findIndex(
    (row) => String(row.projectId) === target || String(row.id) === target
  );

  if (index < 0) {
    const seeded = createProjectUrlSeed(target, projectUrlRecords.length);
    projectUrlRecords = [...projectUrlRecords, seeded];
    index = projectUrlRecords.length - 1;
  }

  const current = projectUrlRecords[index];
  const next = {
    ...current,
    ...patch,
    id: current.id,
    projectId: current.projectId,
    updatedBy: "Current Admin",
    updatedOn: new Date().toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  projectUrlRecords[index] = next;
  return { ...next };
}

export function listMockProjectUrls() {
  return projectUrlRecords.map((row) => ({ ...row }));
}
