function SurveyProgress({ currentIndex, total, progressPercent }) {
  return (
    <div className="pq-progress-section" aria-live="polite">
      <div className="pq-progress-header">
        <span className="pq-progress-percent" aria-hidden>
          {Math.round(progressPercent)}%
        </span>
        <span className="pq-progress-counter">
          Question {currentIndex + 1} of {total}
        </span>
      </div>

      <div
        className="pq-progress-track"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Question ${currentIndex + 1} of ${total}`}
      >
        <div className="pq-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <p className="pq-confidence-message">
        Your answers are saved while completing this questionnaire.
      </p>
    </div>
  );
}

export default SurveyProgress;
