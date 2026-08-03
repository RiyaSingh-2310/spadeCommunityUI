import { ArrowRight, Clock3, Languages, Sparkles } from "lucide-react";
import { getSurveyDescription } from "../../public-questionnaire/utils/surveyHelpers";

function formatLoi(loiMinutes) {
  const minutes = Number(loiMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return "A few minutes";
  if (minutes === 1) return "1 minute";
  return `${minutes} minutes`;
}

function DoSurveyHero({ survey, onStart, disabled, isStarting }) {
  const description = getSurveyDescription(survey);
  const loiLabel = formatLoi(survey?.loiMinutes);
  const modeLabel = survey?.isTest ? "Test" : "Live";

  return (
    <div className="pq-card pq-hero-card">
      <div className="pq-hero-content">
        <div className="pq-hero-badge-row">
          {survey?.language ? (
            <span className="pq-meta-badge">
              <Languages size={14} aria-hidden />
              {survey.language}
            </span>
          ) : null}
          <span className="pq-meta-badge">
            <Clock3 size={14} aria-hidden />
            {loiLabel}
          </span>
          <span className="pq-meta-badge">
            <Sparkles size={14} aria-hidden />
            {modeLabel}
          </span>
        </div>

        <h1 className="pq-hero-title">{survey?.surveyTitle || "Survey"}</h1>
        <p className="pq-hero-description">{description}</p>

        <button
          type="button"
          onClick={onStart}
          disabled={disabled || isStarting}
          className="pq-hero-start-btn admin-btn-primary"
          aria-busy={isStarting}
        >
          {isStarting ? "Starting..." : "Start Survey"}
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default DoSurveyHero;
