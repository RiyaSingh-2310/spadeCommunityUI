const VARIANT_CLASS = {
  success: "pq-redirect-card--success",
  warning: "pq-redirect-card--warning",
  info: "pq-redirect-card--info",
  danger: "pq-redirect-card--danger",
  neutral: "pq-redirect-card--neutral",
};

/**
 * Shared card shell for redirect outcome and fallback content.
 */
function RedirectCard({
  variant = "neutral",
  children,
  role = "status",
  className = "",
  ...rest
}) {
  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.neutral;

  return (
    <div
      className={`pq-card pq-redirect-card ${variantClass} ${className}`.trim()}
      role={role}
      aria-live={role === "status" ? "polite" : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

export default RedirectCard;
