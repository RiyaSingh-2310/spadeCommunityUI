/**
 * Temporary Project URLs mock data.
 * Supports multiple URL configs per project (country / language).
 * Easy to swap for real API integration later.
 */

export const PROJECT_URL_STATUS_OPTIONS = ["Open", "Active", "Closed"];

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

/** Dummy pre-screener groups keyed by language. */
export const MOCK_PRE_SCREENERS = [
  {
    id: "ps-en-general",
    label: "English General",
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
    id: "ps-jp-general",
    label: "Japanese General",
    country: "Japan",
    language: "Japanese",
  },
  {
    id: "ps-jp-electronics",
    label: "Japanese Electronics",
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

let nextUrlId = 1;

function createProjectUrlSeed(projectId, index) {
  const countries = PROJECT_URL_COUNTRY_OPTIONS;
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
  const id = nextUrlId;
  nextUrlId += 1;

  return {
    id,
    projectId: Number(projectId) || projectId,
    clientProjectId: `CLIENT-PRJ-${String(1000 + Number(projectId || index + 1)).padStart(4, "0")}`,
    clientUrl: `https://client.example.com/projects/${projectId || index + 1}`,
    discussion: `Kick-off notes for project ${projectId || index + 1} (${country} / ${language}).`,
    loi: Number((8 + (index % 5) * 1.5).toFixed(1)),
    ir: Number((20 + (index % 6) * 4.5).toFixed(1)),
    country,
    language,
    cpiRate: Number((1.75 + (index % 4) * 0.4).toFixed(2)),
    sampleSize: 400 + index * 50,
    startDate: `2026-0${1 + (index % 6)}-05`,
    endDate: `2026-0${2 + (index % 6)}-25`,
    status: index === 0 ? "Open" : statuses[index % statuses.length],
    testLink: `https://speed-community.com/survey/test/${projectId || index + 1}/${country.toLowerCase().replace(/\s+/g, "-")}`,
    liveLink: `https://speed-community.com/survey/live/${projectId || index + 1}/${country.toLowerCase().replace(/\s+/g, "-")}`,
    geoLocation: index % 2 === 0,
    urlProtection: true,
    uniqueIp: index % 3 === 0,
    fraudDetection: index % 2 !== 0,
    preScreen: true,
    preScreenerId: matched.id,
    completeRewardPoints: 40 + index * 5,
    validateRewardPoints: 8 + (index % 4) * 2,
    redirectComplete: `https://speed-community.com/survey/live/redirect/complete?id=${projectId || index + 1}&c=${index}`,
    redirectTerminate: `https://speed-community.com/survey/live/redirect/terminate?id=${projectId || index + 1}&c=${index}`,
    redirectOverQuota: `https://speed-community.com/survey/live/redirect/over-quota?id=${projectId || index + 1}&c=${index}`,
    redirectQualityTerm: `https://speed-community.com/survey/live/redirect/quality-term?id=${projectId || index + 1}&c=${index}`,
    redirectSurveyClose: `https://speed-community.com/survey/live/redirect/survey-close?id=${projectId || index + 1}&c=${index}`,
    addedBy: "Admin User",
    addedOn: "01 Jan 2026, 10:15 AM",
    updatedBy: "Priya Desai",
    updatedOn: "12 Mar 2026, 02:40 PM",
    deletedBy: "",
    deletedOn: "",
  };
}

/** Mutable Project URL store — multiple rows per project. */
let projectUrlRecords = [];

// Seed 1–2 URL configs for the first 12 project ids.
for (let projectId = 1; projectId <= 12; projectId += 1) {
  projectUrlRecords.push(createProjectUrlSeed(projectId, projectId - 1));
  if (projectId % 2 === 0) {
    projectUrlRecords.push(createProjectUrlSeed(projectId, projectId + 7));
  }
}

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

export function listMockProjectUrlsByProjectId(projectId) {
  const target = String(projectId ?? "").trim();
  if (!target) return [];

  let rows = projectUrlRecords.filter((row) => String(row.projectId) === target);

  if (rows.length === 0) {
    const seeded = createProjectUrlSeed(target, projectUrlRecords.length);
    seeded.status = "Open";
    projectUrlRecords = [...projectUrlRecords, seeded];
    rows = [seeded];
  }

  return rows.map((row) => ({ ...row }));
}

/** @deprecated Prefer listMockProjectUrlsByProjectId for multi-URL support */
export function getMockProjectUrlByProjectId(projectId) {
  const rows = listMockProjectUrlsByProjectId(projectId);
  return rows[0] ? { ...rows[0] } : null;
}

export function getMockProjectUrlById(urlId) {
  const target = String(urlId ?? "").trim();
  const found = projectUrlRecords.find((row) => String(row.id) === target);
  return found ? { ...found } : null;
}

export function createMockProjectUrl(projectId, patch = {}) {
  const seeded = createProjectUrlSeed(projectId, projectUrlRecords.length);
  const next = {
    ...seeded,
    ...patch,
    id: seeded.id,
    projectId: Number(projectId) || projectId,
    status: patch.status || "Open",
    addedBy: "Current Admin",
    addedOn: new Date().toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
  projectUrlRecords = [...projectUrlRecords, next];
  return { ...next };
}

export function updateMockProjectUrlById(urlId, patch = {}) {
  const target = String(urlId ?? "").trim();
  const index = projectUrlRecords.findIndex((row) => String(row.id) === target);
  if (index < 0) return null;

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

/** @deprecated Prefer updateMockProjectUrlById */
export function updateMockProjectUrl(projectId, patch = {}) {
  const rows = listMockProjectUrlsByProjectId(projectId);
  if (!rows.length) {
    return createMockProjectUrl(projectId, patch);
  }
  return updateMockProjectUrlById(rows[0].id, patch);
}

export function deleteMockProjectUrl(urlId) {
  const target = String(urlId ?? "").trim();
  const before = projectUrlRecords.length;
  projectUrlRecords = projectUrlRecords.filter((row) => String(row.id) !== target);
  return projectUrlRecords.length < before;
}

export function listMockProjectUrls() {
  return projectUrlRecords.map((row) => ({ ...row }));
}
