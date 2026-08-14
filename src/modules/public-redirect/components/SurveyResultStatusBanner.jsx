import { Loader2 } from "lucide-react";
import { RESULT_STATUS_PHASE } from "../hooks/useSurveyResultStatus";

/**
 * Loading / success countdown / error strip shown on result pages.
 * Result-page copy stays visible above this banner.
 */
function SurveyResultStatusBanner({
  phase,
  error,
  countdown,
  canRetry,
  onRetry,
}) {
  if (phase === RESULT_STATUS_PHASE.LOADING) {
    return (
      <div
        className="pq-redirect-status pq-redirect-status--loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="pq-loading-spinner" size={20} aria-hidden />
        <p className="pq-redirect-status-text">Updating your survey status...</p>
      </div>
    );
  }

  if (phase === RESULT_STATUS_PHASE.READY) {
    const seconds = Number.isFinite(Number(countdown)) ? Number(countdown) : 0;
    return (
      <div
        className="pq-redirect-status pq-redirect-status--success"
        role="status"
        aria-live="polite"
      >
        <p className="pq-redirect-status-text">
          Your survey status has been updated successfully.
        </p>
        <p className="pq-redirect-countdown">
          Redirecting you in {seconds} second{seconds === 1 ? "" : "s"}...
        </p>
      </div>
    );
  }

  if (phase === RESULT_STATUS_PHASE.MISSING || phase === RESULT_STATUS_PHASE.ERROR) {
    return (
      <div className="pq-redirect-status pq-redirect-status--error" role="alert">
        <p className="pq-redirect-status-text">
          {error ||
            "We could not update your survey status from this link. Please contact support if you need help."}
        </p>
        {canRetry && typeof onRetry === "function" ? (
          <button
            type="button"
            onClick={onRetry}
            className="admin-btn-primary pq-nav-btn mt-4 w-full sm:w-auto"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return null;
}

export default SurveyResultStatusBanner;
