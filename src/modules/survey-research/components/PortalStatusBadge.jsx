function PortalStatusBadge({ status }) {
  const normalized = String(status ?? "").toLowerCase();
  const className =
    normalized === "active" || normalized === "live"
      ? "srp-badge srp-badge-active"
      : normalized === "draft"
        ? "srp-badge srp-badge-draft"
        : normalized === "paused"
          ? "srp-badge srp-badge-draft"
          : "srp-badge srp-badge-inactive";

  return <span className={className}>{status}</span>;
}

export default PortalStatusBadge;
