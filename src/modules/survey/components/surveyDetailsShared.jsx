import { isValidElement } from "react";
import TableCard from "../../../components/admin/TableCard";
import { ExternalLink } from "lucide-react";
import { ADMIN_TABLE_INNER_CLASS } from "../../shared/utils/tableHelpers";
import { formatStatusLabel } from "../../shared/utils/statusLabels";
import { toUiSentenceCase } from "../../shared/utils/uiText";
import CopyValueButton from "./CopyValueButton";

export function SectionDivider() {
  return (
    <hr
      className="my-6 border-0 border-t"
      style={{ borderColor: "var(--admin-header-surface-border)" }}
    />
  );
}

function formatDetailValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (item == null) return "";
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (typeof item === "object") {
          return String(item.label ?? item.name ?? item.title ?? item.code ?? "");
        }
        return "";
      })
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }
  if (typeof value === "object") {
    const label = value.label ?? value.name ?? value.title ?? value.code;
    if (label != null && label !== "") return String(label);
    return "—";
  }
  return String(value);
}

export function DetailField({
  label,
  value,
  className = "",
  copyValue,
  copySuccessMessage,
  copyLabel,
}) {
  const content = isValidElement(value) ? value : formatDetailValue(value);
  const valueToCopy =
    copyValue !== undefined
      ? copyValue
      : typeof value === "string" || typeof value === "number"
        ? value
        : "";
  const showCopy = Boolean(copySuccessMessage);

  return (
    <div className={className}>
      <dt className="admin-text-muted mb-1 text-xs font-semibold tracking-[0.02em]">
        {toUiSentenceCase(label)}
      </dt>
      <dd className="admin-text flex items-start gap-2 break-words text-sm font-medium">
        <span className="min-w-0 flex-1">{content}</span>
        {showCopy ? (
          <CopyValueButton
            value={valueToCopy}
            successMessage={copySuccessMessage}
            label={copyLabel || `Copy ${label}`}
            size="inline"
          />
        ) : null}
      </dd>
    </div>
  );
}

export function DetailGrid({ children, columns = 2 }) {
  const colClass =
    columns === 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : columns === 1
        ? "grid-cols-1"
        : "sm:grid-cols-2";
  return <dl className={`grid gap-4 ${colClass}`}>{children}</dl>;
}

export function ReadOnlyUrl({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="admin-text break-all text-sm font-medium text-[var(--admin-success-text)] hover:underline"
    >
      {url}
    </a>
  );
}

export function TruncatedUrl({ url, maxWidthClass = "max-w-[220px]" }) {
  const urlText = String(url ?? "").trim();
  if (!urlText) {
    return <span className="admin-text">—</span>;
  }

  if (/^https?:\/\//i.test(urlText)) {
    return (
      <a
        href={urlText}
        target="_blank"
        rel="noreferrer noopener"
        className={`admin-text inline-flex max-w-full items-center gap-1.5 text-[var(--admin-primary-color)] hover:underline ${maxWidthClass}`}
        title={urlText}
      >
        <span className="min-w-0 truncate">{urlText}</span>
        <ExternalLink size={14} className="shrink-0 opacity-70" aria-hidden />
      </a>
    );
  }

  return (
    <span
      className={`admin-text inline-block truncate text-sm font-medium ${maxWidthClass}`}
      title={urlText}
    >
      {urlText}
    </span>
  );
}

export function FilterCheckbox({ label, checked, isDarkMode }) {
  return (
    <label
      className={`flex cursor-not-allowed items-center gap-2 rounded-xl border px-3 py-2.5 opacity-80 ${
        "border-[var(--admin-input-border)] bg-[var(--admin-input-bg)]"
      }`}
    >
      <input
        type="checkbox"
        className="admin-checkbox"
        checked={checked}
        disabled
        readOnly
      />
      <span className="admin-text text-sm font-medium">{label}</span>
    </label>
  );
}

export function StatusBadge({ status }) {
  const label = formatStatusLabel(status);
  const key = String(label).trim().toLowerCase();
  const isPositive = key === "active" || key === "open";
  const isClosed = key === "closed" || key === "close";
  const toneClass = isPositive
    ? "bg-[var(--admin-success-text)]/15 text-[var(--admin-success-text)]"
    : isClosed
      ? "bg-[var(--admin-danger-text)]/15 text-[var(--admin-danger-text)]"
      : "bg-[var(--admin-warning-text)]/15 text-[var(--admin-warning-text)]";
  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${toneClass}`}
    >
      {label}
    </span>
  );
}

const TABLE_HEAD =
  "admin-text-muted text-left text-xs font-semibold tracking-[0.02em] whitespace-nowrap";

export function SurveyDataTable({
  title,
  columns,
  rows,
  renderCell,
  isDarkMode,
  footer,
  headerAction,
  emptyMessage = "",
  getRowProps,
}) {
  const hasRows = Array.isArray(rows) && rows.length > 0;

  return (
    <TableCard
      title={title}
      isDarkMode={isDarkMode}
      footer={footer}
      headerAction={headerAction}
    >
      <table className={ADMIN_TABLE_INNER_CLASS}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} className={TABLE_HEAD}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows ? (
            rows.map((row, rowIdx) => (
              <tr
                key={row.id ?? row.sno ?? rowIdx}
                className="align-middle"
                data-partner-mapping-id={row.id != null ? String(row.id) : undefined}
                {...(typeof getRowProps === "function" ? getRowProps(row, rowIdx) : {})}
              >
                {columns.map((col) => (
                  <td key={col} className="admin-text align-middle text-sm">
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))
          ) : emptyMessage ? (
            <tr>
              <td
                colSpan={Math.max(columns.length, 1)}
                className="admin-text-muted py-10 text-center text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </TableCard>
  );
}

export const primaryBtnClass =
  "h-10 cursor-pointer rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]";

export const secondaryBtnClass =
  "admin-btn-cancel h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
