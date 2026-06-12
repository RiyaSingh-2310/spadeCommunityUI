import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import FormField from "../../../components/admin/FormField";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getOptionalUrlError, isFormValid } from "../../shared/utils/validation";
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

const REDIRECT_FIELD_KEYS = REDIRECT_FIELDS.map((field) => field.key);

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

  const errors = useMemo(() => {
    if (!form) return {};
    return REDIRECT_FIELDS.reduce((acc, field) => {
      acc[field.key] = getOptionalUrlError(
        form.redirects[field.key] ?? "",
        field.label
      );
      return acc;
    }, {});
  }, [form]);

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: REDIRECT_FIELD_KEYS,
  });

  if (!isOpen || !form) return null;

  const quota = getSupplierEditForm(form.supplierCode)?.supplierQuota ?? "—";
  const canSubmit = isFormValid(errors) && !isSubmitting;

  const setRedirect = (key, value) => {
    setForm((prev) => ({
      ...prev,
      redirects: { ...prev.redirects, [key]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors)) return;

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

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <FormField label="Supplier">
              <SearchableSelect
                inputClass={inputClass}
                value={form.supplierCode}
                onChange={(nextSupplierCode) =>
                  setForm((prev) => ({ ...prev, supplierCode: nextSupplierCode }))
                }
                options={SUPPLIER_OPTIONS.map((opt) => ({
                  value: opt.code,
                  label: opt.name,
                }))}
                disabled={isSubmitting}
                searchPlaceholder="Search supplier..."
                aria-label="Select supplier"
              />
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
                  <FormField key={field.key} label={field.label} error={showError(field.key)}>
                    <input
                      className={inputClass}
                      value={form.redirects[field.key] ?? ""}
                      onChange={(e) => setRedirect(field.key, e.target.value)}
                      onBlur={() => touch(field.key)}
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
              disabled={!canSubmit}
              className={`${primaryBtnClass} flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50`}
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
