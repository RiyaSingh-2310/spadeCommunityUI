/**
 * Shared card shell for redirect outcome and fallback content.
 * Reuses existing public-questionnaire card styles.
 */
function RedirectCard({
  variant = "neutral",
  children,
  role = "status",
  ...rest
}) {
  const isSuccess = variant === "success";

  return (
    <div
      className={`pq-card pq-state-card ${isSuccess ? "pq-completion-card" : "pq-empty-state"}`}
      role={role}
      aria-live={role === "status" ? "polite" : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

export default RedirectCard;
