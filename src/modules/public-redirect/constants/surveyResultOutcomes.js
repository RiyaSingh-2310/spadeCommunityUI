import { Ban, CheckCircle2, Users } from "lucide-react";
import {
  COMPLETE_THANK_YOU_LINES,
  GENERIC_THANK_YOU_LINES,
} from "./multilingualThankYou";

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
    thankYouLines: COMPLETE_THANK_YOU_LINES,
    variant: "success",
    icon: CheckCircle2,
  },
  [SURVEY_RESULT_OUTCOMES.TERMINATE]: {
    title: "Survey Terminated",
    message: "Survey has been terminated.",
    thankYouLines: GENERIC_THANK_YOU_LINES,
    variant: "warning",
    icon: Ban,
  },
  [SURVEY_RESULT_OUTCOMES.QUOTA_FULL]: {
    title: "Quota Full",
    message: "Quota has already been filled.",
    thankYouLines: GENERIC_THANK_YOU_LINES,
    variant: "info",
    icon: Users,
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
