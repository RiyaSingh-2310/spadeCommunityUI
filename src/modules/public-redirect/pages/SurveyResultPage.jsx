import { useParams } from "react-router-dom";
import RedirectLayout from "../components/RedirectLayout";
import SurveyResultOutcomeView from "../components/SurveyResultOutcomeView";

/**
 * Independent survey result page.
 * Routes:
 *   /complete/:uid
 *   /terminate/:uid
 *   /quota-full/:uid
 *   /quality-terminate/:uid
 *   /survey-closed/:uid
 *
 * Each page calls only its matching status API, then redirects to the
 * API-provided redirect_url after a 5-second countdown.
 */
function SurveyResultPage({ outcome, isDarkMode, onToggleTheme }) {
  const { uid: uidParam } = useParams();

  return (
    <RedirectLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      <SurveyResultOutcomeView outcome={outcome} pathUid={uidParam} />
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

export function QualityTerminateSurveyResultPage(props) {
  return <SurveyResultPage {...props} outcome="quality-terminate" />;
}

export function SurveyClosedSurveyResultPage(props) {
  return <SurveyResultPage {...props} outcome="survey-closed" />;
}

export default SurveyResultPage;
