import { PartyPopper } from "lucide-react";

function SurveyCompletion({ message, submissionId }) {
  return (
    <div className="pq-card pq-state-card pq-completion-card">
      <div className="pq-completion-icon" aria-hidden>
        <PartyPopper size={36} strokeWidth={1.75} />
      </div>

      <h1 className="pq-completion-title">Thank You!</h1>

      <p className="pq-completion-message">
        {message || "Your responses have been submitted successfully."}
      </p>

      {submissionId != null ? (
        <div className="pq-submission-id-box">
          <span className="pq-submission-id-label">Submission ID</span>
          <span className="pq-submission-id-value">#{submissionId}</span>
        </div>
      ) : null}

      <p className="pq-completion-footer">We appreciate your participation.</p>
    </div>
  );
}

export default SurveyCompletion;
