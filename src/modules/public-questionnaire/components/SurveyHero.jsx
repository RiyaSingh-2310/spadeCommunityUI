import { ArrowRight, Clock3, Languages, ListChecks } from "lucide-react";
import { estimateCompletionTime, getSurveyDescription } from "../utils/surveyHelpers";

function SurveyHero({ questionnaire, questionCount, onStart, disabled }) {
  const estimatedTime = estimateCompletionTime(questionCount);
  const description = getSurveyDescription(questionnaire);

  return (
    <div className="pq-card pq-hero-card">
      <div className="pq-hero-content">
        <div className="pq-hero-badge-row">
          <span className="pq-meta-badge">
            <Languages size={14} aria-hidden />
            {questionnaire.language}
          </span>
          <span className="pq-meta-badge">
            <ListChecks size={14} aria-hidden />
            {questionCount} {questionCount === 1 ? "Question" : "Questions"}
          </span>
          <span className="pq-meta-badge">
            <Clock3 size={14} aria-hidden />
            {estimatedTime}
          </span>
        </div>

        <h1 className="pq-hero-title">{questionnaire.surveyTitle}</h1>
        <p className="pq-hero-description">{description}</p>

        <button
          type="button"
          onClick={onStart}
          disabled={disabled}
          className="pq-hero-start-btn admin-btn-primary"
        >
          Start Survey
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default SurveyHero;
