export function isAnswerProvided(question, value) {
  if (!question?.required) return true;
  if (question.questionType === "Checkbox") {
    return Array.isArray(value) && value.length > 0;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value != null && value !== "";
}
