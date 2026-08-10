import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

/**
 * Canonical redirect outcome keys matching Partner Mapping / backend redirect paths.
 * Route pattern: /redirect/:outcome
 * Required direct routes: /redirect/complete | /redirect/terminate | /redirect/quota-full
 *
 * Independent path-UID result pages live at:
 *   /complete/:uid | /terminate/:uid | /quota-full/:uid
 * See surveyResultOutcomes.js and getSurveyOutcomePath().
 */
export const REDIRECT_OUTCOMES = {
  COMPLETE: "complete",
  TERMINATE: "terminate",
  /** Canonical quota-full path segment (also accepts legacy `overquota`). */
  QUOTA_FULL: "quota-full",
  /** @deprecated Prefer QUOTA_FULL — kept for existing redirect URLs. */
  OVERQUOTA: "overquota",
  QUALITYTERM: "qualityterm",
  SURVEYCLOSE: "surveyclose",
};

const QUOTA_FULL_CONFIG = {
  title: "Quota Full",
  message:
    "The required number of responses has already been collected. Thank you for your interest.",
  variant: "info",
  icon: Info,
};

/**
 * UI copy + visual config per redirect outcome.
 * Frontend-only — no status/business fields until backend integration.
 */
export const REDIRECT_OUTCOME_CONFIG = {
  [REDIRECT_OUTCOMES.COMPLETE]: {
    title: "Survey Completed",
    message:
      "Your survey has been completed successfully. Thank you for your participation.",
    variant: "success",
    icon: CheckCircle2,
  },
  [REDIRECT_OUTCOMES.TERMINATE]: {
    title: "Survey Terminated",
    message: "This survey has been terminated. Thank you.",
    variant: "warning",
    icon: AlertTriangle,
  },
  [REDIRECT_OUTCOMES.QUOTA_FULL]: QUOTA_FULL_CONFIG,
  [REDIRECT_OUTCOMES.OVERQUOTA]: QUOTA_FULL_CONFIG,
  [REDIRECT_OUTCOMES.QUALITYTERM]: {
    title: "Quality Check Failed",
    message:
      "Unfortunately, you did not qualify to continue this survey. Thank you for your participation.",
    variant: "info",
    icon: Info,
  },
  [REDIRECT_OUTCOMES.SURVEYCLOSE]: {
    title: "Survey Closed",
    message: "This survey is no longer available. Thank you for your interest.",
    variant: "info",
    icon: Info,
  },
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

  return key;
}

export function getRedirectOutcomeConfig(outcome) {
  const key = normalizeRedirectOutcomeKey(outcome);
  return REDIRECT_OUTCOME_CONFIG[key] ?? null;
}

export function isValidRedirectOutcome(outcome) {
  return getRedirectOutcomeConfig(outcome) != null;
}
