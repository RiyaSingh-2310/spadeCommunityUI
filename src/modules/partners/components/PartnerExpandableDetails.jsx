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
  getPartnerExpandableSections,
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

function DetailValue({ value, isUrl }) {
  const display = value != null && String(value).trim() !== "" ? String(value) : "—";

  if (isUrl && display !== "—" && isValidUrl(display)) {
    return (
      <a
        href={formatUrlForHref(display)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-start gap-1.5 break-all text-[#138842] hover:underline"
      >
        <span className="min-w-0 break-all">{display}</span>
        <ExternalLink size={13} className="mt-0.5 shrink-0" aria-hidden />
      </a>
    );
  }

  if (isUrl && display !== "—") {
    return <span className="break-all text-[var(--admin-danger-text)]">{display}</span>;
  }

  return <span className="admin-text break-words">{display}</span>;
}

function ExpandableSectionTable({ title, fields }) {
  if (!fields.length) return null;

  return (
    <div className="space-y-2">
      {title ? (
        <h4 className="admin-text text-sm font-semibold">{title}</h4>
      ) : null}
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
                  <DetailValue value={field.value} isUrl={field.isUrl} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpandableUrlDetails({ title, fields }) {
  if (!fields.length) return null;

  return (
    <div className="space-y-3">
      {title ? (
        <h4 className="admin-text text-sm font-semibold">{title}</h4>
      ) : null}
      <dl className="flex flex-col gap-4">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0 max-w-full">
            <dt className="admin-text-muted mb-1 text-xs font-semibold uppercase tracking-wide">
              {field.label}
            </dt>
            <dd className="admin-text text-sm leading-relaxed">
              <DetailValue value={field.value} isUrl={field.isUrl} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PartnerExpandableDetails({ partnerId }) {
  const [sections, setSections] = useState({ partnerInfo: [], urlInfo: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const normalizedId = String(partnerId ?? "").trim();
    if (!normalizedId) {
      setSections({ partnerInfo: [], urlInfo: [] });
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
        setSections(getPartnerExpandableSections(partner));
      } catch (error) {
        if (cancelled) return;
        setSections({ partnerInfo: [], urlInfo: [] });
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

  const hasDetails = sections.partnerInfo.length > 0 || sections.urlInfo.length > 0;

  if (!hasDetails) {
    return (
      <p className="admin-text-muted text-sm">No partner details available.</p>
    );
  }

  return (
    <div className="space-y-6">
      <ExpandableSectionTable title="Partner Information" fields={sections.partnerInfo} />
      <ExpandableUrlDetails title="URL Information" fields={sections.urlInfo} />
    </div>
  );
}

export default PartnerExpandableDetails;
