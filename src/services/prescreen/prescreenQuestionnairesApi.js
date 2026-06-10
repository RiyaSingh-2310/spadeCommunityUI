import {
  deletePrescreenQuestionnaire,
  getPrescreenQuestionnaireById,
  getQuestionnaireTitlesByLanguage,
  loadPrescreenQuestionnaires,
  mapPrescreenQuestionnaireToRow,
  upsertPrescreenQuestionnaire,
} from "../../modules/prescreen/data/prescreenQuestionnairesStore";

/** Prescreen questionnaire records used by the Prescreen module. */
export async function getRecords() {
  const items = loadPrescreenQuestionnaires().map((record) => mapPrescreenQuestionnaireToRow(record));
  return {
    items,
    total: items.length,
    count: items.length,
  };
}

export async function getRecord(id) {
  const record = getPrescreenQuestionnaireById(id);
  if (!record) {
    throw new Error("Prescreen questionnaire not found");
  }
  return record;
}

/**
 * Questionnaire titles for Survey Group selection, filtered by language.
 * @param {string} language
 */
export async function getQuestionnaireTitlesForLanguage(language) {
  return getQuestionnaireTitlesByLanguage(language);
}

/**
 * @param {Parameters<typeof upsertPrescreenQuestionnaire>[0]} payload
 */
export async function saveRecord(payload) {
  return upsertPrescreenQuestionnaire(payload);
}

export async function deleteRecord(id) {
  deletePrescreenQuestionnaire(id);
  return { success: true };
}
