const STORAGE_KEY = "prescreen-questionnaires";
const DEMO_SEED_VERSION = "2026-06-10-v1";

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

function normalizeLanguage(language) {
  return String(language ?? "").trim();
}

function normalizeTitle(title) {
  return String(title ?? "").trim();
}

function createDemoRecord({ id, language, questionnaireTitle }) {
  const defaultOptions = ["Option 1", "Option 2"];
  return {
    id,
    language,
    questionnaireTitle,
    title: questionnaireTitle,
    rightAnswer: defaultOptions[0],
    status: "Active",
    options: defaultOptions.map((optionText, index) => ({
      optionText,
      mappedOption: `mapped_${index + 1}`,
      rightAnswer: defaultOptions[0],
    })),
  };
}

function buildDemoRecords() {
  const englishTitles = [
    "Gender",
    "Country",
    "Ethnicity",
    "Profession",
    "Specialty Area",
    "Disease Type",
    "Age Group",
  ];
  const arabicTitles = ["Gender", "Country", "Profession"];

  const english = englishTitles.map((title, index) =>
    createDemoRecord({
      id: `demo-en-${index + 1}`,
      language: "English",
      questionnaireTitle: title,
    })
  );

  const arabic = arabicTitles.map((title, index) =>
    createDemoRecord({
      id: `demo-ar-${index + 1}`,
      language: "Arabic",
      questionnaireTitle: title,
    })
  );

  return [...english, ...arabic];
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

/**
 * @returns {Array<{
 *   id: string,
 *   language: string,
 *   questionnaireTitle: string,
 *   title: string,
 *   rightAnswer: string,
 *   status: string,
 *   options: Array<{ optionText: string, mappedOption: string, rightAnswer: string }>,
 * }>}
 */
export function loadPrescreenQuestionnaires() {
  return ensureDemoSeed();
}

export function savePrescreenQuestionnaires(records) {
  writeStorage(records);
  return records;
}

export function getPrescreenQuestionnaireById(id) {
  return loadPrescreenQuestionnaires().find((record) => String(record.id) === String(id)) ?? null;
}

export function getQuestionnaireTitlesByLanguage(language) {
  const normalizedLanguage = normalizeLanguage(language);
  if (!normalizedLanguage) return [];

  const titles = loadPrescreenQuestionnaires()
    .filter((record) => normalizeLanguage(record.language) === normalizedLanguage)
    .map((record) => normalizeTitle(record.questionnaireTitle || record.title))
    .filter(Boolean);

  return [...new Set(titles)];
}

/**
 * @param {{
 *   id?: string,
 *   language: string,
 *   questionnaireTitle: string,
 *   rightAnswer?: string,
 *   status?: string,
 *   options?: Array<{ optionText: string, mappedOption: string, rightAnswer: string }>,
 * }} payload
 */
export function upsertPrescreenQuestionnaire(payload) {
  const records = loadPrescreenQuestionnaires();
  const questionnaireTitle = normalizeTitle(payload.questionnaireTitle);
  const language = normalizeLanguage(payload.language);

  const nextRecord = {
    id: payload.id ? String(payload.id) : `ps-${Date.now()}`,
    language,
    questionnaireTitle,
    title: questionnaireTitle,
    rightAnswer: payload.rightAnswer ?? "",
    status: payload.status ?? "Active",
    options: Array.isArray(payload.options) ? payload.options : [],
  };

  const existingIndex = records.findIndex((record) => String(record.id) === String(nextRecord.id));
  const nextRecords =
    existingIndex >= 0
      ? records.map((record, index) => (index === existingIndex ? { ...record, ...nextRecord } : record))
      : [...records, nextRecord];

  savePrescreenQuestionnaires(nextRecords);
  return nextRecord;
}

export function deletePrescreenQuestionnaire(id) {
  const nextRecords = loadPrescreenQuestionnaires().filter(
    (record) => String(record.id) !== String(id)
  );
  savePrescreenQuestionnaires(nextRecords);
  return nextRecords;
}

export function mapPrescreenQuestionnaireToRow(record) {
  return {
    id: record.id,
    title: record.questionnaireTitle || record.title || "",
    language: record.language ?? "",
    rightAnswer: record.rightAnswer ?? "",
    status: record.status ?? "Active",
    options: record.options ?? [],
  };
}
