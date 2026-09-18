import { useState } from "react";
import { numberFmt } from "./dashboardUtils";

function asChartData(data) {
  return Array.isArray(data) ? data : [];
}

/** Build evenly spaced numeric ticks from 0 up to a nice ceiling above maxValue. */
function buildYAxisTicks(maxValue, tickCount = 4) {
  const safeMax = Math.max(Number(maxValue) || 0, 0);
  if (safeMax === 0) return [0, 1];

  const rawStep = safeMax / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  let niceFactor = 10;
  if (residual <= 1) niceFactor = 1;
  else if (residual <= 2) niceFactor = 2;
  else if (residual <= 5) niceFactor = 5;

  const step = niceFactor * magnitude;
  const niceMax = Math.ceil(safeMax / step) * step;
  const ticks = [];
  for (let value = 0; value <= niceMax + step / 2; value += step) {
    ticks.push(Number(value.toPrecision(12)));
  }
  return ticks;
}

function chartCategoryName(item) {
  return item?.fullLabel || item?.label || "";
}

function chartNumericValue(item) {
  const n = Number(item?.value);
  return Number.isFinite(n) ? n : 0;
}

export function PolylineChart({ data }) {
  const series = asChartData(data);
  const [hoverIdx, setHoverIdx] = useState(null);

  const plotW = 100;
  const plotH = 40;
  const maxValue = Math.max(...series.map(chartNumericValue), 0);
  const yTicks = buildYAxisTicks(maxValue);
  const yMax = yTicks[yTicks.length - 1] || 1;

  const pointAt = (idx) => {
    const x = series.length <= 1 ? plotW / 2 : (idx / (series.length - 1)) * plotW;
    const value = chartNumericValue(series[idx]);
    const y = plotH - (value / yMax) * plotH;
    return { x, y, value };
  };

  const points = series
    .map((_, idx) => {
      const { x, y } = pointAt(idx);
      return `${x},${y}`;
    })
    .join(" ");

  const hovered = hoverIdx != null ? series[hoverIdx] : null;
  const hoveredPoint = hoverIdx != null ? pointAt(hoverIdx) : null;
  const bandWidth = series.length > 0 ? plotW / series.length : plotW;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Persistent Y-axis so labels stay readable and do not disappear on narrow layouts */}
        <div
          className="admin-text-muted flex w-8 shrink-0 flex-col justify-between self-stretch py-0.5 text-right text-[10px] leading-none sm:w-9 sm:text-[11px]"
          aria-hidden={series.length === 0}
        >
          {[...yTicks].reverse().map((tick) => (
            <span key={`y-${tick}`}>{numberFmt(tick)}</span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${plotW} ${plotH}`}
            className="h-36 w-full overflow-visible"
            role="img"
            aria-label="Trend chart"
            onMouseLeave={() => setHoverIdx(null)}
          >
            {yTicks.map((tick) => {
              const y = plotH - (tick / yMax) * plotH;
              return (
                <line
                  key={`grid-${tick}`}
                  x1="0"
                  y1={y}
                  x2={plotW}
                  y2={y}
                  stroke="var(--admin-header-search-border)"
                  strokeWidth="0.35"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            <line
              x1="0"
              y1="0"
              x2="0"
              y2={plotH}
              stroke="var(--admin-muted-foreground)"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1={plotH}
              x2={plotW}
              y2={plotH}
              stroke="var(--admin-muted-foreground)"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />

            {series.length > 0 ? (
              <polyline
                fill="none"
                stroke="var(--admin-primary-color)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}

            {series.map((item, idx) => {
              const { x, y } = pointAt(idx);
              const isActive = hoverIdx === idx;
              const bandX = Math.min(Math.max(0, x - bandWidth / 2), plotW - bandWidth);
              return (
                <g key={`${chartCategoryName(item)}-${idx}`}>
                  {/* Full-column hit target so every category is reliably hoverable */}
                  <rect
                    x={bandX}
                    y={0}
                    width={bandWidth}
                    height={plotH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIdx(idx)}
                    onFocus={() => setHoverIdx(idx)}
                    onBlur={() => setHoverIdx(null)}
                    tabIndex={0}
                    role="img"
                    aria-label={`${chartCategoryName(item)}: ${numberFmt(chartNumericValue(item))}`}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? 2.4 : 1.6}
                    fill="var(--admin-primary-color)"
                    stroke={isActive ? "var(--admin-surface-bg)" : "none"}
                    strokeWidth={isActive ? 0.9 : 0}
                    pointerEvents="none"
                  />
                </g>
              );
            })}
          </svg>

          {hovered && hoveredPoint ? (
            <div
              className={`pointer-events-none absolute z-10 rounded-md border border-[var(--admin-header-surface-border)] bg-[var(--admin-header-surface)] px-2 py-1 shadow-sm ${
                hoveredPoint.y < plotH * 0.3
                  ? "translate-y-2"
                  : "-translate-y-[calc(100%+8px)]"
              } ${
                hoveredPoint.x < plotW * 0.15
                  ? "translate-x-0"
                  : hoveredPoint.x > plotW * 0.85
                    ? "-translate-x-full"
                    : "-translate-x-1/2"
              }`}
              style={{
                left: `${(hoveredPoint.x / plotW) * 100}%`,
                top: `${(hoveredPoint.y / plotH) * 100}%`,
              }}
              role="tooltip"
            >
              <p className="admin-text max-w-[10rem] truncate text-[11px] font-semibold leading-tight">
                {chartCategoryName(hovered)}
              </p>
              <p className="admin-text-muted text-[11px] leading-tight">
                {numberFmt(hoveredPoint.value)}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {series.length > 0 ? (
        <div className="flex justify-between gap-0.5 overflow-hidden pl-10 sm:pl-11">
          {series.map((item, idx) => (
            <span
              key={`${chartCategoryName(item)}-${idx}`}
              className={`admin-text-muted min-w-0 flex-1 truncate text-center text-[10px] leading-tight ${
                hoverIdx === idx ? "admin-text font-semibold" : ""
              }`}
              title={chartCategoryName(item)}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
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

export function SummaryCard({ icon: Icon, label, value, onClick }) {
  const clickable = typeof onClick === "function";

  return (
    <article
      className={`rounded-3xl border border-[var(--admin-header-surface-border)] bg-[var(--admin-header-surface)] p-4${
        clickable
          ? " cursor-pointer transition hover:border-[var(--admin-primary-color)]/50 hover:bg-[var(--admin-permissions-row-hover)]"
          : ""
      }`}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Open ${label}` : undefined}
    >
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

