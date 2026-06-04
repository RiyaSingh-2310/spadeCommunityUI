import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import FormField from "../../../components/admin/FormField";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { SUPPLIER_OPTIONS, getSupplierEditForm } from "../data/surveyDetailsData";
import { updateSupplierMapping } from "../services/surveyApi";
import { primaryBtnClass } from "./surveyDetailsShared";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

const REDIRECT_FIELDS = [
  { key: "complete", label: "Complete", placeholder: "https://example.com/complete" },
  { key: "terminate", label: "Terminate", placeholder: "https://example.com/terminate" },
  { key: "overQuota", label: "Over Quota", placeholder: "https://example.com/over-quota" },
  { key: "qualityTerm", label: "Quality Term", placeholder: "https://example.com/quality-term" },
  { key: "surveyClose", label: "Survey Close", placeholder: "https://example.com/survey-close" },
  { key: "postbackUrl", label: "Postback URL", placeholder: "https://example.com/postback" },
];

function SupplierMappingEditModal({ isOpen, onClose, surveyId, supplierCode, onUpdated }) {
  const inputClass = getAdminInputClass();
  const [form, setForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !supplierCode) {
      setForm(null);
      return;
    }
    const initial = getSupplierEditForm(supplierCode);
    setForm(
      initial
        ? {
            supplierCode: initial.supplierCode,
            cpi: initial.cpi,
            redirects: { ...initial.redirects },
          }
        : null
    );
  }, [isOpen, supplierCode]);

  if (!isOpen || !form) return null;

  const quota = getSupplierEditForm(form.supplierCode)?.supplierQuota ?? "—";

  const setRedirect = (key, value) => {
    setForm((prev) => ({
      ...prev,
      redirects: { ...prev.redirects, [key]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await updateSupplierMapping(surveyId, {
        supplierCode: form.supplierCode,
        cpi: form.cpi,
        redirects: form.redirects,
      });
      toastApiSuccess(data);
      onUpdated?.();
      onClose();
    } catch (err) {
      toastApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close edit supplier"
        onClick={onClose}
        disabled={isSubmitting}
      />
      <div
        className="admin-header-surface relative z-10 flex max-h-[min(92vh,800px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-mapping-edit-title"
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <h2 id="supplier-mapping-edit-title" className="admin-text text-lg font-bold">
            Edit Supplier
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="admin-icon-btn admin-text-subtle flex h-8 w-8 items-center justify-center rounded-lg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <FormField label="Supplier">
              <select
                className={inputClass}
                value={form.supplierCode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, supplierCode: e.target.value }))
                }
                disabled={isSubmitting}
              >
                {SUPPLIER_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Supplier Quota">
              <input className={inputClass} value={quota} readOnly disabled />
            </FormField>

            <FormField label="CPI">
              <input
                className={inputClass}
                value={form.cpi}
                onChange={(e) => setForm((prev) => ({ ...prev, cpi: e.target.value }))}
                disabled={isSubmitting}
              />
            </FormField>

            <div>
              <h3 className="admin-text mb-3 text-sm font-bold">
                Supplier Dynamic Redirect Link
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {REDIRECT_FIELDS.map((field) => (
                  <FormField key={field.key} label={field.label}>
                    <input
                      className={inputClass}
                      value={form.redirects[field.key] ?? ""}
                      onChange={(e) => setRedirect(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={isSubmitting}
                    />
                    <p className="admin-text-subtle mt-1 text-[11px]">
                      Example: {field.placeholder}
                    </p>
                  </FormField>
                ))}
              </div>
            </div>
          </div>

          <div
            className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-5 py-4"
            style={{ borderColor: "var(--admin-header-surface-border)" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={getAdminCancelButtonClass("modal")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${primaryBtnClass} flex items-center gap-2`}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SupplierMappingEditModal;
