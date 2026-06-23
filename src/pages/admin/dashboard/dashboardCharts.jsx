import { numberFmt } from "./dashboardUtils";

export function PolylineChart({ data }) {
  const width = 100;
  const height = 44;
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data
    .map((item, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * width;
      const y = height - (item.value / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full">
      <polyline fill="none" stroke="var(--admin-primary-color)" strokeWidth="2.5" points={points} />
      {data.map((item, idx) => {
        const x = (idx / Math.max(data.length - 1, 1)) * width;
        const y = height - (item.value / max) * (height - 4) - 2;
        return (
          <circle key={`${item.label}-${idx}`} cx={x} cy={y} r="1.6" fill="var(--admin-primary-color)" />
        );
      })}
    </svg>
  );
}

export function DonutChart({ data }) {
  const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = data.map((item) => (item.value / total) * circumference);
  const offsets = segments.map((_, idx) =>
    segments.slice(0, idx).reduce((sum, current) => sum + current, 0)
  );
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-40 w-40 shrink-0">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--admin-header-search-border)" strokeWidth="14" />
        {data.map((item, idx) => (
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
        {data.map((item) => (
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
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="grid grid-cols-3 gap-3 pt-3">
      {data.map((item) => (
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
