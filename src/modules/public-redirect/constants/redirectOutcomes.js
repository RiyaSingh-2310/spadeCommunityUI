import {
  Ban,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  COMPLETE_THANK_YOU_LINES,
  GENERIC_THANK_YOU_LINES,
} from "./multilingualThankYou";

/**
 * Canonical redirect outcome keys matching Partner Mapping / backend redirect paths.
 * Route pattern: /redirect/:outcome
 * Required direct routes:
 *   /redirect/complete | /redirect/terminate | /redirect/quota-full
 *   /redirect/quality-terminate | /redirect/survey-closed
 *
 * Independent path-UID result pages live at:
 *   /complete/:uid | /terminate/:uid | /quota-full/:uid
 *   /quality-terminate/:uid | /survey-closed/:uid
 * See surveyResultOutcomes.js and getSurveyOutcomePath().
 */
export const REDIRECT_OUTCOMES = {
  COMPLETE: "complete",
  TERMINATE: "terminate",
  /** Canonical quota-full path segment (also accepts legacy `overquota`). */
  QUOTA_FULL: "quota-full",
  /** @deprecated Prefer QUOTA_FULL — kept for existing redirect URLs. */
  OVERQUOTA: "overquota",
  QUALITY_TERMINATE: "quality-terminate",
  /** @deprecated Prefer QUALITY_TERMINATE — kept for existing redirect URLs. */
  QUALITYTERM: "qualityterm",
  SURVEY_CLOSED: "survey-closed",
  /** @deprecated Prefer SURVEY_CLOSED — kept for existing redirect URLs. */
  SURVEYCLOSE: "surveyclose",
};

const QUOTA_FULL_CONFIG = {
  title: "Quota Full",
  message: "Quota has already been filled.",
  thankYouLines: GENERIC_THANK_YOU_LINES,
  variant: "info",
  icon: Users,
};

const QUALITY_TERMINATE_CONFIG = {
  title: "Quality Check Failed",
  message:
    "Unfortunately, you did not qualify to continue this survey. Thank you for your participation.",
  thankYouLines: GENERIC_THANK_YOU_LINES,
  variant: "danger",
  icon: ShieldAlert,
};

const SURVEY_CLOSED_CONFIG = {
  title: "Survey Closed",
  message: "This survey is no longer available. Thank you for your interest.",
  thankYouLines: GENERIC_THANK_YOU_LINES,
  variant: "neutral",
  icon: Lock,
};

/**
 * UI copy + visual config per redirect outcome.
 */
export const REDIRECT_OUTCOME_CONFIG = {
  [REDIRECT_OUTCOMES.COMPLETE]: {
    title: "Survey Completed",
    message:
      "You have completed our survey. We are checking the data and if there would be any error we would get back to you",
    thankYouLines: COMPLETE_THANK_YOU_LINES,
    variant: "success",
    icon: CheckCircle2,
  },
  [REDIRECT_OUTCOMES.TERMINATE]: {
    title: "Survey Terminated",
    message: "Survey has been terminated.",
    thankYouLines: GENERIC_THANK_YOU_LINES,
    variant: "warning",
    icon: Ban,
  },
  [REDIRECT_OUTCOMES.QUOTA_FULL]: QUOTA_FULL_CONFIG,
  [REDIRECT_OUTCOMES.OVERQUOTA]: QUOTA_FULL_CONFIG,
  [REDIRECT_OUTCOMES.QUALITYTERM]: QUALITY_TERMINATE_CONFIG,
  [REDIRECT_OUTCOMES.QUALITY_TERMINATE]: QUALITY_TERMINATE_CONFIG,
  [REDIRECT_OUTCOMES.SURVEYCLOSE]: SURVEY_CLOSED_CONFIG,
  [REDIRECT_OUTCOMES.SURVEY_CLOSED]: SURVEY_CLOSED_CONFIG,
};

/** Normalize legacy / alternate outcome path segments to a config key. */
function normalizeRedirectOutcomeKey(outcome) {
  const key = String(outcome ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (
    key === "quota-full" ||
    key === "quotafull" ||
    key === "overquota" ||
    key === "over-quota"
  ) {
    return REDIRECT_OUTCOMES.QUOTA_FULL;
  }

  if (
    key === "quality-terminate" ||
    key === "qualityterminate" ||
    key === "qualityterm" ||
    key === "quality-term"
  ) {
    return REDIRECT_OUTCOMES.QUALITY_TERMINATE;
  }

  if (
    key === "survey-closed" ||
    key === "surveyclosed" ||
    key === "surveyclose" ||
    key === "survey-close"
  ) {
    return REDIRECT_OUTCOMES.SURVEY_CLOSED;
  }

  return key;
}

export function getRedirectOutcomeConfig(outcome) {
  const key = normalizeRedirectOutcomeKey(outcome);
  return REDIRECT_OUTCOME_CONFIG[key] ?? null;
}

export function isValidRedirectOutcome(outcome) {
  return getRedirectOutcomeConfig(outcome) != null;
}
