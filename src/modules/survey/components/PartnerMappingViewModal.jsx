import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import {
  getSupplierMappingById,
  mapSupplierMappingToDetail,
  appendIsTestToPartnerUrl,
} from "../services/supplierMappingApi";
import { DetailField, DetailGrid, ReadOnlyUrl } from "./surveyDetailsShared";
import { toastApiError } from "../../../services/toast/apiToast";

function PartnerMappingViewModal({
  isOpen,
  onClose,
  mappingId,
  partnerName,
  isMultiLink = false,
  onPartnerUrlClick,
}) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !mappingId) {
      setDetail(null);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    getSupplierMappingById(mappingId)
      .then((data) => {
        if (!cancelled) setDetail(mapSupplierMappingToDetail(data));
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(null);
          toastApiError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, mappingId]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close partner mapping details"
        onClick={onClose}
      />
      <div
        className="admin-header-surface relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-mapping-view-title"
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <h2 id="partner-mapping-view-title" className="admin-text text-lg font-bold">
            Partner Mapping Details
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
              {detail.mappingCode ? (
                <DetailField label="Mapping Code" value={detail.mappingCode} />
              ) : null}
              <DetailField
                label="Partner Name"
                value={detail.partnerName ?? partnerName}
              />
              <DetailField label="Partner Quota" value={detail.quota} />
              <DetailField label="CPI" value={detail.cpi} />
              {isMultiLink ? (
                <DetailField
                  label="Links To Assign"
                  value={detail.linksToAssign ?? "—"}
                />
              ) : null}
              <DetailField
                label="Status"
                value={detail.statusActive ? "Active" : "Inactive"}
              />
              <DetailField
                label="Is Test?"
                value={detail.isTest ? "Yes" : "No"}
              />
              <DetailField label="Complete" value={detail.complete} />
              <DetailField label="Terminate" value={detail.terminate} />
              <DetailField label="Over Quota" value={detail.overQuota} />
              <DetailField label="Quality Term" value={detail.qualityTerm} />
              <DetailField label="Survey Close" value={detail.surveyClose} />
              <DetailField
                label="Post Back Url"
                value={<ReadOnlyUrl url={detail.postbackUrl} />}
              />
              <DetailField
                label="Partner URL"
                value={
                  onPartnerUrlClick ? (
                    <button
                      type="button"
                      className="admin-text break-all text-sm font-medium text-[var(--admin-success-text)] hover:underline"
                      onClick={() =>
                        onPartnerUrlClick({
                          mappingId,
                          partnerUrl: detail.partnerUrl,
                          isTest: detail.isTest,
                        })
                      }
                      title={appendIsTestToPartnerUrl(detail.partnerUrl, detail.isTest)}
                    >
                      {appendIsTestToPartnerUrl(detail.partnerUrl, detail.isTest)}
                    </button>
                  ) : (
                    <ReadOnlyUrl
                      url={appendIsTestToPartnerUrl(detail.partnerUrl, detail.isTest)}
                    />
                  )
                }
              />
            </DetailGrid>
          )}
          {!isLoading && !detail && (
            <p className="admin-text-muted py-8 text-center text-sm">
              Failed to load partner mapping details.
            </p>
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

export default PartnerMappingViewModal;
