import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import { fetchSupplierMappingDetails } from "../services/surveyApi";
import { DetailField, DetailGrid, ReadOnlyUrl } from "./surveyDetailsShared";
import { toastApiError } from "../../../services/toast/apiToast";

function SupplierMappingViewModal({
  isOpen,
  onClose,
  surveyId,
  supplierCode,
  supplierName,
}) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !supplierCode) {
      setDetail(null);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    fetchSupplierMappingDetails(surveyId, supplierCode)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) toastApiError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, surveyId, supplierCode]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close supplier mapping details"
        onClick={onClose}
      />
      <div
        className="admin-header-surface relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-mapping-view-title"
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <h2 id="supplier-mapping-view-title" className="admin-text text-lg font-bold">
            Supplier Mapping Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="admin-icon-btn admin-text-subtle flex h-8 w-8 items-center justify-center rounded-lg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin text-[var(--admin-success-text)]" />
            </div>
          )}
          {!isLoading && detail && (
            <DetailGrid columns={1}>
              <DetailField label="Supplier Name" value={detail.supplierName ?? supplierName} />
              <DetailField label="Supplier Quota" value={detail.supplierQuota} />
              <DetailField label="CPI" value={detail.cpi} />
              <DetailField label="Complete" value={detail.complete} />
              <DetailField label="Terminate" value={detail.terminate} />
              <DetailField label="Over Quota" value={detail.overQuota} />
              <DetailField label="Quality Term" value={detail.qualityTerm} />
              <DetailField label="Survey Close" value={detail.surveyClose} />
              <DetailField
                label="Postback URL"
                value={<ReadOnlyUrl url={detail.postbackUrl} />}
              />
              <DetailField
                label="Vendor URL"
                value={<ReadOnlyUrl url={detail.vendorUrl} />}
              />
            </DetailGrid>
          )}
        </div>

        <div
          className="shrink-0 border-t px-5 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <button type="button" onClick={onClose} className={getAdminCancelButtonClass("modal")}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupplierMappingViewModal;
