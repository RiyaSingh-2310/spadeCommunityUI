import { useParams } from "react-router-dom";
import RedirectLayout from "../components/RedirectLayout";
import SurveyResultOutcomeView from "../components/SurveyResultOutcomeView";

/**
 * Public survey redirect outcome page.
 * Routes: /redirect/:outcome
 *   complete | terminate | quota-full (legacy: overquota)
 *   quality-terminate (legacy: qualityterm)
 *   survey-closed (legacy: surveyclose)
 *
 * Direct URL access: /redirect/{outcome}?pid={pid}&uid={uid}
 * Calls only the matching status API for this outcome.
 */
function SurveyRedirectPage({ isDarkMode, onToggleTheme }) {
  const { outcome: outcomeParam } = useParams();
  const outcome = String(outcomeParam ?? "")
    .trim()
    .toLowerCase();

  return (
    <RedirectLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      <SurveyResultOutcomeView outcome={outcome} />
    </RedirectLayout>
  );
}

export default SurveyRedirectPage;
