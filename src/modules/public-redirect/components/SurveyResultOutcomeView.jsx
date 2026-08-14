import RedirectCard from "./RedirectCard";
import RedirectMessage from "./RedirectMessage";
import FallbackState from "./FallbackState";
import SurveyResultStatusBanner from "./SurveyResultStatusBanner";
import { getRedirectOutcomeConfig } from "../constants/redirectOutcomes";
import { useSurveyResultStatus } from "../hooks/useSurveyResultStatus";

function SurveyResultOutcomeContent({ outcome, outcomeConfig, pathUid = "" }) {
  const status = useSurveyResultStatus({
    outcome,
    pathUid,
  });
  const variant = outcomeConfig.variant || "neutral";

  return (
    <RedirectCard
      variant={variant}
      data-survey-result-outcome={outcome}
      data-survey-result-pid={status.pid || "missing"}
      data-survey-result-uid={status.uid || "missing"}
    >
      <RedirectMessage
        title={outcomeConfig.title}
        message={outcomeConfig.message}
        icon={outcomeConfig.icon}
        variant={variant}
        thankYouLines={outcomeConfig.thankYouLines}
      />

      <SurveyResultStatusBanner
        phase={status.phase}
        error={status.error}
        countdown={status.countdown}
        canRetry={status.canRetry}
        onRetry={status.retry}
      />
    </RedirectCard>
  );
}

/**
 * Shared result-page shell: keep the existing outcome UI visible, call the
 * matching status API once, then countdown to the API-provided redirect_url.
 */
function SurveyResultOutcomeView({ outcome, pathUid = "" }) {
  const outcomeKey = String(outcome ?? "")
    .trim()
    .toLowerCase();
  const outcomeConfig = getRedirectOutcomeConfig(outcomeKey);

  if (!outcomeConfig) {
    return (
      <FallbackState
        title="Survey result unavailable"
        description="This survey result link is not recognized. Please use a valid survey result URL or contact support."
      />
    );
  }

  return (
    <SurveyResultOutcomeContent
      outcome={outcomeKey}
      outcomeConfig={outcomeConfig}
      pathUid={pathUid}
    />
  );
}

export default SurveyResultOutcomeView;
