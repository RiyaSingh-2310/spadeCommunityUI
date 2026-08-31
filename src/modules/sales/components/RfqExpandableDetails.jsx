import { toUiSentenceCase } from "../../shared/utils/uiText";

function DetailField({ label, value, ellipsis = false }) {
  const display = value != null && String(value).trim() !== "" ? String(value) : "—";

  return (
    <div className="min-w-0">
      <p className="admin-text-subtle text-xs font-semibold tracking-[0.02em]">
        {toUiSentenceCase(label)}
      </p>
      <p
        className={`admin-text mt-1 text-sm ${ellipsis ? "max-w-[280px] truncate" : "break-words"}`}
        title={ellipsis && display !== "—" ? display : undefined}
      >
        {display}
      </p>
    </div>
  );
}

function RfqExpandableDetails({ row }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DetailField label="Email Subject" value={row.emailSubject} ellipsis />
      <DetailField label="Status" value={row.status} />
      <DetailField label="Sales Manager" value={row.salesManager} />
    </div>
  );
}

export default RfqExpandableDetails;
