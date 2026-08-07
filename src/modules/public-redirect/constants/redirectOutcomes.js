import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

/**
 * Canonical redirect outcome keys matching Partner Mapping / backend redirect paths.
 * Route pattern: /redirect/:outcome
 */
export const REDIRECT_OUTCOMES = {
  COMPLETE: "complete",
  TERMINATE: "terminate",
  OVERQUOTA: "overquota",
  QUALITYTERM: "qualityterm",
  SURVEYCLOSE: "surveyclose",
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
  [REDIRECT_OUTCOMES.OVERQUOTA]: {
    title: "Quota Full",
    message:
      "The required number of responses has already been collected. Thank you for your interest.",
    variant: "info",
    icon: Info,
  },
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

export function getRedirectOutcomeConfig(outcome) {
  const key = String(outcome ?? "")
    .trim()
    .toLowerCase();
  return REDIRECT_OUTCOME_CONFIG[key] ?? null;
}

export function isValidRedirectOutcome(outcome) {
  return getRedirectOutcomeConfig(outcome) != null;
}
