export function estimateCompletionTime(questionCount) {
  if (questionCount <= 0) return "1 minute";
  const minutes = Math.max(1, Math.ceil(questionCount * 0.75));
  if (minutes === 1) return "1 minute";
  if (minutes === 2) return "1–2 minutes";
  return `${minutes - 1}–${minutes} minutes`;
}

export function getSurveyDescription(questionnaire) {
  const fromApi = String(
    questionnaire?.surveyDescription ??
      questionnaire?.description ??
      questionnaire?.survey_description ??
      ""
  ).trim();
  return fromApi || "Please answer all questions honestly.";
}

export function classifySurveyError(message) {
  const text = String(message ?? "").toLowerCase();
  if (text.includes("not active") || text.includes("expired")) {
    return "expired";
  }
  if (text.includes("not found") || text.includes("missing")) {
    return "invalid";
  }
  if (text.includes("already submitted") || text.includes("duplicate")) {
    return "submitted";
  }
  return "error";
}
