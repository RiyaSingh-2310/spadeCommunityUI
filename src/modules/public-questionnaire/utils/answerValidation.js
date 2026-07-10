export function isAnswerProvided(question, value) {
  if (!question?.required) return true;

  const questionType = String(question.questionType ?? "").trim().toLowerCase();
  if (questionType === "checkbox") {
    return Array.isArray(value) && value.length > 0;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value != null && value !== "";
}
