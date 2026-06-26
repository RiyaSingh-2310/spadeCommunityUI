import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toastApiError } from "../../../services/toast/apiToast";
import {
  ADMIN_TABLE_INNER_CLASS,
  ADMIN_TABLE_INNER_SHELL_CLASS,
  TABLE_HEAD_BASE,
} from "../../shared/utils/tableHelpers";
import {
  getPartnerDetailCached,
  getPartnerExpandableFields,
} from "../../../services/partners/partnersApi";

function isValidUrl(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

function formatUrlForHref(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed.includes("://") ? trimmed : `https://${trimmed}`;
}

function CellValue({ value, isUrl }) {
  const display = value != null && String(value).trim() !== "" ? String(value) : "—";

  if (isUrl && display !== "—" && isValidUrl(display)) {
    return (
      <a
        href={formatUrlForHref(display)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 break-all text-[#138842] hover:underline"
      >
        {display}
        <ExternalLink size={13} className="shrink-0" aria-hidden />
      </a>
    );
  }

  if (isUrl && display !== "—") {
    return <span className="break-words text-[var(--admin-danger-text)]">{display}</span>;
  }

  return <span className="admin-text break-words">{display}</span>;
}

function PartnerExpandableDetails({ partnerId }) {
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const normalizedId = String(partnerId ?? "").trim();
    if (!normalizedId) {
      setFields([]);
      setIsLoading(false);
      setLoadFailed(true);
      return undefined;
    }

    let cancelled = false;

    const loadPartnerDetail = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const partner = await getPartnerDetailCached(normalizedId);
        if (cancelled) return;
        setFields(getPartnerExpandableFields(partner));
      } catch (error) {
        if (cancelled) return;
        setFields([]);
        setLoadFailed(true);
        toastApiError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadPartnerDetail();

    return () => {
      cancelled = true;
    };
  }, [partnerId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[72px] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <p className="admin-text-muted text-sm">Unable to load partner details.</p>
    );
  }

  if (fields.length === 0) {
    return (
      <p className="admin-text-muted text-sm">No partner details available.</p>
    );
  }

  return (
    <div className={ADMIN_TABLE_INNER_SHELL_CLASS}>
      <table className={ADMIN_TABLE_INNER_CLASS}>
        <thead>
          <tr className="admin-text-muted">
            {fields.map((field) => (
              <th key={field.label} className={`${TABLE_HEAD_BASE} text-left`}>
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="align-middle">
            {fields.map((field) => (
              <td key={field.label} className="align-middle">
                <CellValue value={field.value} isUrl={field.isUrl} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default PartnerExpandableDetails;
