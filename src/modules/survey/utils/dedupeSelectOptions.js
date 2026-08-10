/**
 * Frontend-only option/list deduplication for dropdowns and question lists.
 * Does not mutate API payloads — only the rendered options layer.
 */

/**
 * @param {{ value?: string|number, label?: string }[]} options
 * @returns {{ value: string, label: string }[]}
 */
export function dedupeSelectOptions(options) {
  const list = Array.isArray(options) ? options : [];
  const byValue = new Map();
  const seenLabels = new Set();

  for (const option of list) {
    if (!option || typeof option !== "object") continue;
    const value = String(option.value ?? "").trim();
    const label = String(option.label ?? "").trim();
    if (!value || !label) continue;
    if (byValue.has(value)) continue;

    const labelKey = label.toLowerCase();
    // Exact same display name → keep first stable option only.
    if (seenLabels.has(labelKey)) continue;

    byValue.set(value, { ...option, value, label });
    seenLabels.add(labelKey);
  }

  return Array.from(byValue.values());
}

/**
 * Deduplicate questionnaire / pre-screen questions by stable id, then by text+type.
 * @param {object[]} questions
 * @param {{ idKeys?: string[], textKeys?: string[], typeKeys?: string[] }} [options]
 */
export function dedupeQuestionsByIdentity(questions, options = {}) {
  const list = Array.isArray(questions) ? questions : [];
  const idKeys = options.idKeys ?? ["id", "question_id", "questionId"];
  const textKeys = options.textKeys ?? [
    "questionText",
    "question_title",
    "questionTitle",
    "question_text",
    "title",
  ];
  const typeKeys = options.typeKeys ?? ["questionType", "question_type", "type"];

  const seenIds = new Set();
  const seenFingerprints = new Set();
  const result = [];

  for (const question of list) {
    if (!question || typeof question !== "object") continue;

    let id = "";
    for (const key of idKeys) {
      const raw = question[key];
      if (raw != null && String(raw).trim() !== "") {
        id = String(raw).trim();
        break;
      }
    }

    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      result.push(question);
      continue;
    }

    let text = "";
    for (const key of textKeys) {
      const raw = question[key];
      if (raw != null && String(raw).trim() !== "") {
        text = String(raw).trim().toLowerCase();
        break;
      }
    }
    let type = "";
    for (const key of typeKeys) {
      const raw = question[key];
      if (raw != null && String(raw).trim() !== "") {
        type = String(raw).trim().toLowerCase();
        break;
      }
    }

    const fingerprint = `${text}::${type}`;
    if (!text || seenFingerprints.has(fingerprint)) continue;
    seenFingerprints.add(fingerprint);
    result.push(question);
  }

  return result;
}
