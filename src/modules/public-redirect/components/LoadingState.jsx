import { Loader2 } from "lucide-react";
import RedirectCard from "./RedirectCard";

function LoadingState({ message = "Processing your response..." }) {
  return (
    <RedirectCard variant="neutral" aria-busy="true" aria-live="polite">
      <Loader2 className="pq-loading-spinner mx-auto" size={32} aria-hidden />
      <p className="pq-redirect-message mt-4">{message}</p>
    </RedirectCard>
  );
}

export default LoadingState;
