import TableCard from "../../../components/admin/TableCard";
import { formatStatusLabel } from "../../shared/utils/statusLabels";

export function SectionDivider() {
  return (
    <hr
      className="my-6 border-0 border-t"
      style={{ borderColor: "var(--admin-header-surface-border)" }}
    />
  );
}

export function DetailField({ label, value, className = "" }) {
  const content =
    value === null || value === undefined || value === "" ? (
      "—"
    ) : typeof value === "string" || typeof value === "number" ? (
      value
    ) : (
      value
    );

  return (
    <div className={className}>
      <dt className="admin-text-muted mb-1 text-xs font-semibold uppercase tracking-wide">
        {label}
      </dt>
      <dd className="admin-text break-words text-sm font-medium">{content}</dd>
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
  return (
    <span
      className={`admin-text inline-block truncate text-sm font-medium text-[var(--admin-success-text)] ${maxWidthClass}`}
      title={url}
    >
      {url}
    </span>
  );
}

export function FilterCheckbox({ label, checked, isDarkMode }) {
  return (
    <label
      className={`flex cursor-not-allowed items-center gap-2 rounded-xl border px-3 py-2.5 opacity-80 ${
        isDarkMode ? "border-[#344662] bg-[#101a2a]" : "border-[#d5deea] bg-[#f4f8fc]"
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
  const isActive = label === "Active";
  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-[var(--admin-success-text)]/15 text-[var(--admin-success-text)]"
          : "bg-[var(--admin-warning-text)]/15 text-[var(--admin-warning-text)]"
      }`}
    >
      {label}
    </span>
  );
}

const TABLE_HEAD =
  "admin-text-muted px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

export function SurveyDataTable({ title, columns, rows, renderCell, isDarkMode, footer }) {
  return (
    <TableCard title={title} isDarkMode={isDarkMode} footer={footer}>
      <table className="admin-table min-w-full text-sm">
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
          {rows.map((row, rowIdx) => (
            <tr
              key={row.id ?? row.sno ?? rowIdx}
              className="border-t align-middle"
              style={{ borderColor: "var(--admin-header-surface-border)" }}
            >
              {columns.map((col) => (
                <td key={col} className="admin-text px-3 py-3 align-middle text-sm">
                  {renderCell(row, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

export const primaryBtnClass =
  "h-10 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]";

export const secondaryBtnClass =
  "admin-btn-cancel h-10 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
