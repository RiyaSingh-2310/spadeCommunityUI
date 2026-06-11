const STORAGE_KEY = "prescreen-groups";
const DEMO_SEED_VERSION = "2026-06-11-v1";

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStorage(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function buildDemoRecords() {
  return [
    {
      id: "pg-demo-1",
      survey_title: "General Screening",
      language: "English",
      status: "active",
      questions: ["Gender", "Country", "Age Group"],
      created_at: new Date().toISOString(),
    },
    {
      id: "pg-demo-2",
      survey_title: "Arabic Panel Screening",
      language: "Arabic",
      status: "active",
      questions: ["Gender", "Country"],
      created_at: new Date().toISOString(),
    },
  ];
}

function ensureDemoSeed() {
  const seedFlag = localStorage.getItem(`${STORAGE_KEY}-seed`);
  const stored = readStorage();
  if (stored?.length && seedFlag === DEMO_SEED_VERSION) {
    return stored;
  }

  const demo = buildDemoRecords();
  writeStorage(demo);
  localStorage.setItem(`${STORAGE_KEY}-seed`, DEMO_SEED_VERSION);
  return demo;
}

export function loadPrescreenGroups() {
  return ensureDemoSeed();
}

export function savePrescreenGroups(records) {
  writeStorage(records);
  return records;
}

export function getPrescreenGroupById(id) {
  return loadPrescreenGroups().find((record) => String(record.id) === String(id)) ?? null;
}

function resolveQuestions(payload) {
  const single = String(payload.selectedQuestionnaire ?? "").trim();
  if (single) return [single];

  if (Array.isArray(payload.selectedQuestionnaires)) {
    return payload.selectedQuestionnaires.map((question) => String(question ?? "").trim()).filter(Boolean);
  }

  return String(payload.questionnaireList ?? "")
    .split("\n")
    .map((question) => question.trim())
    .filter(Boolean);
}

/**
 * @param {{
 *   id?: string|number,
 *   surveyTitle: string,
 *   language: string,
 *   status?: string,
 *   selectedQuestionnaire?: string,
 *   selectedQuestionnaires?: string[],
 *   questionnaireList?: string,
 * }} payload
 */
export function upsertPrescreenGroup(payload) {
  const records = loadPrescreenGroups();
  const surveyTitle = String(payload.surveyTitle ?? "").trim();
  const language = String(payload.language ?? "").trim();
  const status = String(payload.status ?? "Active").toLowerCase() === "inactive" ? "inactive" : "active";

  const nextRecord = {
    id: payload.id != null ? String(payload.id) : `pg-${Date.now()}`,
    survey_title: surveyTitle,
    language,
    status,
    questions: resolveQuestions(payload),
    created_at: new Date().toISOString(),
  };

  const existingIndex = records.findIndex((record) => String(record.id) === String(nextRecord.id));
  const nextRecords =
    existingIndex >= 0
      ? records.map((record, index) =>
          index === existingIndex ? { ...record, ...nextRecord, created_at: record.created_at } : record
        )
      : [...records, nextRecord];

  savePrescreenGroups(nextRecords);
  return nextRecord;
}

export function deletePrescreenGroup(id) {
  const nextRecords = loadPrescreenGroups().filter((record) => String(record.id) !== String(id));
  savePrescreenGroups(nextRecords);
  return nextRecords;
}
