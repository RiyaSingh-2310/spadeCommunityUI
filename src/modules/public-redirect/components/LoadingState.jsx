import { Loader2 } from "lucide-react";

function LoadingState({ message = "Processing your response..." }) {
  return (
    <div className="pq-card pq-state-card pq-loading-card" aria-busy="true" aria-live="polite">
      <Loader2 className="pq-loading-spinner" size={32} aria-hidden />
      <p className="pq-loading-text">{message}</p>
    </div>
  );
}

export default LoadingState;
