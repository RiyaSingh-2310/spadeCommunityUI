import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toastApiError } from "../../../services/toast/apiToast";
import {
  getPartnerDetailCached,
  getPartnerExpandableFields,
} from "../../../services/partners/partnersApi";

function DetailField({ label, value }) {
  const display = value != null && String(value).trim() !== "" ? String(value) : "—";

  return (
    <div className="min-w-0">
      <p className="admin-text-subtle text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="admin-text mt-1 break-words text-sm">{display}</p>
    </div>
  );
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {fields.map((field) => (
        <div
          key={field.label}
          className={ "min-w-0"}
        >
          <DetailField label={field.label} value={field.value} />
        </div>
      ))}
    </div>
  );
}

export default PartnerExpandableDetails;
