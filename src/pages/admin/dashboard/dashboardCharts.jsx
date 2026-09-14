import { numberFmt } from "./dashboardUtils";

function asChartData(data) {
  return Array.isArray(data) ? data : [];
}

export function PolylineChart({ data }) {
  const series = asChartData(data);
  const width = 100;
  const height = 44;
  const max = Math.max(...series.map((d) => d.value), 1);
  const points = series
    .map((item, idx) => {
      const x = (idx / Math.max(series.length - 1, 1)) * width;
      const y = height - (item.value / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full">
        <polyline fill="none" stroke="var(--admin-primary-color)" strokeWidth="2.5" points={points} />
        {series.map((item, idx) => {
          const x = (idx / Math.max(series.length - 1, 1)) * width;
          const y = height - (item.value / max) * (height - 4) - 2;
          const title = item.fullLabel
            ? `${item.fullLabel}: ${numberFmt(item.value)}`
            : `${item.label}: ${numberFmt(item.value)}`;
          return (
            <circle
              key={`${item.label}-${idx}`}
              cx={x}
              cy={y}
              r="1.6"
              fill="var(--admin-primary-color)"
            >
              <title>{title}</title>
            </circle>
          );
        })}
      </svg>
      {series.length > 0 ? (
        <div className="flex justify-between gap-0.5 overflow-hidden">
          {series.map((item, idx) => (
            <span
              key={`${item.fullLabel ?? item.label}-${idx}`}
              className="admin-text-muted min-w-0 flex-1 truncate text-center text-[10px] leading-tight"
              title={item.fullLabel ?? item.label}
            >
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DonutChart({ data }) {
  const series = asChartData(data);
  const total = Math.max(series.reduce((sum, item) => sum + item.value, 0), 1);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = series.map((item) => (item.value / total) * circumference);
  const offsets = segments.map((_, idx) =>
    segments.slice(0, idx).reduce((sum, current) => sum + current, 0)
  );
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-40 w-40 shrink-0">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--admin-header-search-border)" strokeWidth="14" />
        {series.map((item, idx) => (
          <circle
            key={item.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth="14"
            strokeDasharray={`${segments[idx]} ${circumference}`}
            strokeDashoffset={-offsets[idx]}
            transform="rotate(-90 60 60)"
          />
        ))}
      </svg>
      <div className="space-y-2">
        {series.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="admin-text-muted">{item.label}</span>
            <span className="admin-text font-semibold">{numberFmt(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarsChart({ data }) {
  const series = asChartData(data);
  const max = Math.max(...series.map((d) => d.value), 1);
  return (
    <div className="grid grid-cols-3 gap-3 pt-3">
      {series.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="h-28 rounded-xl bg-[var(--admin-header-search-bg)] p-2">
            <div
              className="mx-auto mt-auto h-full w-8 rounded-md"
              style={{
                backgroundColor: "var(--admin-primary-color)",
                transformOrigin: "bottom",
                transform: `scaleY(${Math.max(item.value / max, 0.06)})`,
              }}
            />
          </div>
          <p className="admin-text-muted text-center text-xs">{item.label}</p>
          <p className="admin-text text-center text-sm font-semibold">{numberFmt(item.value)}</p>
        </div>
      ))}
    </div>
  );
}

export function HorizontalBarsChart({ data }) {
  const series = asChartData(data).slice(0, 8);
  const max = Math.max(...series.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {series.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="admin-text-muted min-w-0 truncate" title={item.label}>
              {item.label}
            </span>
            <span className="admin-text font-semibold">{numberFmt(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-header-search-bg)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((item.value / max) * 100, 4)}%`,
                backgroundColor: item.color || "var(--admin-primary-color)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SummaryCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-3xl border border-[var(--admin-header-surface-border)] bg-[var(--admin-header-surface)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--admin-header-search-bg)]">
          <Icon size={18} className="text-[var(--admin-primary-color)]" />
        </span>
      </div>
      <p className="admin-text-muted text-xs">{label}</p>
      <p className="admin-text mt-1 text-xl font-bold">{numberFmt(value)}</p>
    </article>
  );
}

function percentLabel(item) {
  if (item.percent == null) return numberFmt(item.value);
  return `${numberFmt(item.value)} · ${item.percent}%`;
}

export function AnalyticsDonutChart({ data }) {
  const series = asChartData(data);
  const total = Math.max(series.reduce((sum, item) => sum + Number(item.value || 0), 0), 1);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = series.map((item) => (Number(item.value || 0) / total) * circumference);
  const offsets = segments.map((_, idx) =>
    segments.slice(0, idx).reduce((sum, current) => sum + current, 0)
  );

  if (series.length === 0) {
    return (
      <p className="admin-text-muted py-8 text-center text-sm">No response data available for this question.</p>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" className="mx-auto h-44 w-44 shrink-0 sm:mx-0">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--admin-header-search-border)" strokeWidth="14" />
        {series.map((item, idx) => (
          <circle
            key={`${item.label}-${idx}`}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={item.color || "var(--admin-primary-color)"}
            strokeWidth="14"
            strokeDasharray={`${segments[idx]} ${circumference}`}
            strokeDashoffset={-offsets[idx]}
            transform="rotate(-90 60 60)"
          >
            <title>{`${item.label}: ${numberFmt(item.value)} respondents (${item.percent ?? Math.round((item.value / total) * 100)}%)`}</title>
          </circle>
        ))}
      </svg>
      <ul className="min-w-0 flex-1 space-y-2.5">
        {series.map((item, idx) => (
          <li key={`${item.label}-${idx}`} className="flex items-start gap-2 text-sm">
            <span
              className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color || "var(--admin-primary-color)" }}
            />
            <span className="admin-text min-w-0 flex-1 break-words">{item.label}</span>
            <span className="admin-text shrink-0 font-semibold">{percentLabel(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalyticsHorizontalBars({ data, maxRows = 12 }) {
  const series = asChartData(data).slice(0, maxRows);
  const max = Math.max(...series.map((item) => Number(item.value || 0)), 1);

  if (series.length === 0) {
    return (
      <p className="admin-text-muted py-8 text-center text-sm">No response data available for this question.</p>
    );
  }

  return (
    <div className="space-y-3">
      {series.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="space-y-1.5">
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="admin-text min-w-0 flex-1 break-words leading-snug">{item.label}</span>
            <span className="admin-text shrink-0 font-semibold">{percentLabel(item)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--admin-header-search-bg)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((Number(item.value || 0) / max) * 100, 3)}%`,
                backgroundColor: item.color || "var(--admin-primary-color)",
              }}
              title={`${item.label}: ${numberFmt(item.value)} respondents`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsHistogram({ data }) {
  const series = asChartData(data);
  const max = Math.max(...series.map((item) => Number(item.value || 0)), 1);

  if (series.length === 0) {
    return (
      <p className="admin-text-muted py-8 text-center text-sm">No response data available for this question.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3 md:grid-cols-6">
      {series.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="flex min-w-0 flex-col items-center gap-2">
          <div className="flex h-36 w-full items-end rounded-xl bg-[var(--admin-header-search-bg)] px-2 py-2">
            <div
              className="mx-auto w-full max-w-[2.25rem] rounded-md"
              style={{
                height: `${Math.max((Number(item.value || 0) / max) * 100, 8)}%`,
                backgroundColor: item.color || "var(--admin-primary-color)",
              }}
              title={`${item.label}: ${numberFmt(item.value)} panelists (${item.percent ?? 0}%)`}
            />
          </div>
          <p className="admin-text-muted w-full break-words text-center text-xs leading-tight">{item.label}</p>
          <p className="admin-text text-center text-sm font-semibold">{percentLabel(item)}</p>
        </div>
      ))}
    </div>
  );
}

