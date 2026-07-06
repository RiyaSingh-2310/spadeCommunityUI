function AnalyticsKpiCard({ label, value, tone = "default" }) {
  const toneColor =
    tone === "success"
      ? "var(--srp-success)"
      : tone === "warning"
        ? "var(--srp-warning)"
        : tone === "danger"
          ? "var(--srp-danger)"
          : "var(--srp-primary)";

  return (
    <div className="srp-card p-5">
      <p className="text-sm font-medium" style={{ color: "var(--srp-text-muted)" }}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight" style={{ color: toneColor }}>
        {value}
      </p>
    </div>
  );
}

function TrendBarChart({ data }) {
  const maxValue = Math.max(...data.flatMap((item) => [item.completes, item.terminates]), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2" style={{ minHeight: 180 }}>
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end justify-center gap-1">
              <div
                className="w-3 rounded-t-md"
                style={{
                  height: `${(item.completes / maxValue) * 100}%`,
                  background: "var(--srp-primary)",
                  minHeight: item.completes ? 4 : 0,
                }}
                title={`Completes: ${item.completes}`}
              />
              <div
                className="w-3 rounded-t-md"
                style={{
                  height: `${(item.terminates / maxValue) * 100}%`,
                  background: "var(--srp-warning)",
                  minHeight: item.terminates ? 4 : 0,
                }}
                title={`Terminates: ${item.terminates}`}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--srp-text-muted)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-xs font-medium">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--srp-primary)" }} />
          Completes
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--srp-warning)" }} />
          Terminates
        </span>
      </div>
    </div>
  );
}

function FunnelChart({ stages }) {
  const max = stages[0]?.value || 1;

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const width = Math.max(12, Math.round((stage.value / max) * 100));
        return (
          <div key={stage.stage}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{stage.stage}</span>
              <span style={{ color: "var(--srp-text-muted)" }}>{stage.value.toLocaleString()}</span>
            </div>
            <div
              className="h-8 rounded-lg"
              style={{
                width: `${width}%`,
                background: `color-mix(in srgb, var(--srp-primary) ${100 - index * 15}%, transparent)`,
                border: "1px solid var(--srp-border)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function OutcomeDonut({ completed, terminated, overQuota, qualityFailed }) {
  const total = completed + terminated + overQuota + qualityFailed || 1;
  const segments = [
    { label: "Completed", value: completed, color: "var(--srp-success)" },
    { label: "Terminated", value: terminated, color: "var(--srp-warning)" },
    { label: "Over Quota", value: overQuota, color: "var(--srp-primary)" },
    { label: "Quality Failed", value: qualityFailed, color: "var(--srp-danger)" },
  ];

  let offset = 0;
  const gradientStops = segments
    .map((segment) => {
      const percent = (segment.value / total) * 100;
      const start = offset;
      offset += percent;
      return `${segment.color} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="h-40 w-40 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${gradientStops})`,
          boxShadow: "inset 0 0 0 18px var(--srp-surface)",
        }}
        aria-hidden
      />
      <div className="grid w-full gap-2 sm:max-w-xs">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.color }} />
              {segment.label}
            </span>
            <span className="font-semibold">{segment.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { AnalyticsKpiCard, TrendBarChart, FunnelChart, OutcomeDonut };
