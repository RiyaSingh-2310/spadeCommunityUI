import { AlertCircle } from "lucide-react";
import RedirectCard from "./RedirectCard";

/**
 * Friendly fallback when a redirect outcome or URL params cannot be used.
 * Never shows a blank screen or generic “unable to load” copy.
 */
function FallbackState({
  title = "Redirect link unavailable",
  description = "This redirect link could not be processed. Please check the URL or contact support if you need help.",
  onRetry,
}) {
  return (
    <RedirectCard variant="neutral" role="alert">
      <div className="pq-empty-icon" aria-hidden>
        <AlertCircle size={32} strokeWidth={1.75} />
      </div>
      <h1 className="pq-empty-title">{title}</h1>
      <p className="pq-empty-description">{description}</p>
      {typeof onRetry === "function" ? (
        <button
          type="button"
          onClick={onRetry}
          className="admin-btn-primary pq-nav-btn mt-6 w-full sm:w-auto"
        >
          Try again
        </button>
      ) : null}
    </RedirectCard>
  );
}

export default FallbackState;
