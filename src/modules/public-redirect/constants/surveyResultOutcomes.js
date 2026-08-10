import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

/**
 * Independent survey result routes (path-param UID).
 * Separate from /redirect/:outcome supplier callbacks.
 */
export const SURVEY_RESULT_OUTCOMES = {
  COMPLETE: "complete",
  TERMINATE: "terminate",
  QUOTA_FULL: "quota-full",
};

export const SURVEY_RESULT_OUTCOME_CONFIG = {
  [SURVEY_RESULT_OUTCOMES.COMPLETE]: {
    title: "Survey Completed",
    message:
      "You have completed our survey. We are checking the data and if there would be any error we would get back to you",
    thankYouLines: [
      "Thank you for participating in this survey!",
      "¡Gracias por completar nuestra encuesta!",
      "Merci d'avoir repondu à notre sondage!",
      "Grazie per la partecipazione al sondaggio!",
      "Tack för att du svarat på vår undersökning!",
      "成功！您已经 完成了 我们的 调查。",
      "成功！あなた は 私たちの 調査を 完了 しました。",
      "성공! 당신 은 우리 의 설문 조사 를 완료 했습니다.",
    ],
    variant: "success",
    icon: CheckCircle2,
  },
  [SURVEY_RESULT_OUTCOMES.TERMINATE]: {
    title: "Survey Terminated",
    message:
      "This survey has ended for you. Thank you for your time and interest.",
    thankYouLines: [
      "Thank you for participating in this survey!",
      "¡Gracias por completar nuestra encuesta!",
      "Merci d'avoir repondu à notre sondage!",
    ],
    variant: "warning",
    icon: AlertTriangle,
  },
  [SURVEY_RESULT_OUTCOMES.QUOTA_FULL]: {
    title: "Quota Full",
    message:
      "The required number of responses has already been collected. Thank you for your interest.",
    thankYouLines: [
      "Thank you for your interest in this survey!",
      "¡Gracias por su interés!",
      "Merci pour votre intérêt!",
    ],
    variant: "info",
    icon: Info,
  },
};

export function getSurveyResultOutcomeConfig(outcome) {
  const key = String(outcome ?? "")
    .trim()
    .toLowerCase();
  return SURVEY_RESULT_OUTCOME_CONFIG[key] ?? null;
}

export function isValidSurveyResultOutcome(outcome) {
  return getSurveyResultOutcomeConfig(outcome) != null;
}

/**
 * Normalize path UID for display / future API use.
 * Missing or placeholder UIDs are treated as invalid but pages still render.
 * @param {unknown} uid
 */
export function normalizeResultUid(uid) {
  const trimmed = String(uid ?? "").trim();
  if (!trimmed || trimmed === "unknown" || trimmed === "undefined" || trimmed === "null") {
    return "";
  }
  if (
    trimmed === "[identifier]" ||
    trimmed === "identifier" ||
    trimmed === "XXX" ||
    trimmed === "XXXX"
  ) {
    return "";
  }
  return trimmed;
}
