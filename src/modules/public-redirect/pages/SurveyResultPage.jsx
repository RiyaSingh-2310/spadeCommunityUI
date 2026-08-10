import { useMemo } from "react";
import { useParams } from "react-router-dom";
import RedirectLayout from "../components/RedirectLayout";
import RedirectCard from "../components/RedirectCard";
import RedirectMessage from "../components/RedirectMessage";
import FallbackState from "../components/FallbackState";
import {
  getSurveyResultOutcomeConfig,
  normalizeResultUid,
} from "../constants/surveyResultOutcomes";

/**
 * Independent survey result page.
 * Routes: /complete/:uid | /terminate/:uid | /quota-full/:uid
 *
 * Frontend-only shell — ready for future API integration.
 * Always renders a message (never blank / never "Unable to load this page").
 */
function SurveyResultPage({ outcome, isDarkMode, onToggleTheme }) {
  const { uid: uidParam } = useParams();
  const outcomeKey = String(outcome ?? "")
    .trim()
    .toLowerCase();
  const outcomeConfig = getSurveyResultOutcomeConfig(outcomeKey);
  const uid = useMemo(() => normalizeResultUid(uidParam), [uidParam]);

  if (!outcomeConfig) {
    return (
      <RedirectLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
        <FallbackState
          title="Survey result unavailable"
          description="This survey result link is not recognized. Please use a valid survey result URL or contact support."
        />
      </RedirectLayout>
    );
  }

  const variant =
    outcomeConfig.variant === "success" ? "success" : "neutral";

  return (
    <RedirectLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      <RedirectCard
        variant={variant}
        data-survey-result-outcome={outcomeKey}
        data-survey-result-uid={uid || "missing"}
      >
        <RedirectMessage
          title={outcomeConfig.title}
          message={outcomeConfig.message}
          icon={outcomeConfig.icon}
          variant={variant}
        />

        {Array.isArray(outcomeConfig.thankYouLines) &&
        outcomeConfig.thankYouLines.length > 0 ? (
          <ul
            className="mt-6 space-y-2 text-center text-sm text-[var(--pq-muted, #6b7280)]"
            aria-label="Thank you messages"
          >
            {outcomeConfig.thankYouLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}

        {!uid ? (
          <p
            className="mt-4 text-center text-xs text-[var(--pq-muted,#9ca3af)]"
            role="status"
          >
            Respondent identifier was missing or invalid on this link. You can
            still close this page.
          </p>
        ) : (
          <p className="sr-only">Respondent identifier: {uid}</p>
        )}
      </RedirectCard>
    </RedirectLayout>
  );
}

export function CompleteSurveyResultPage(props) {
  return <SurveyResultPage {...props} outcome="complete" />;
}

export function TerminateSurveyResultPage(props) {
  return <SurveyResultPage {...props} outcome="terminate" />;
}

export function QuotaFullSurveyResultPage(props) {
  return <SurveyResultPage {...props} outcome="quota-full" />;
}

export default SurveyResultPage;
