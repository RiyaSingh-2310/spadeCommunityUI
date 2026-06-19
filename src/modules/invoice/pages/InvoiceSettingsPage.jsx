import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import LogoImageUpload from "../../../components/admin/LogoImageUpload";
import TableCard from "../../../components/admin/TableCard";
import { useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getRequiredError,
  isFormValidForFields,
} from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  fetchInvoiceSettings,
  updateInvoiceSettings,
} from "../services/invoiceSettingsApi";

const INVOICE_SETTINGS_FIELDS = ["address", "paymentTerms", "footerContent"];

const EMPTY_FORM = {
  address: "",
  paymentTerms: "",
  footerContent: "",
};

function InvoiceSettingsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [existingLogoImage, setExistingLogoImage] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { readOnly, showSubmit } = useFormAccess();
  const inputClass = getAdminInputClass();

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const settings = await fetchInvoiceSettings();
        if (cancelled) return;

        const snapshot = {
          address: settings.address,
          paymentTerms: settings.paymentTerms,
          footerContent: settings.footerContent,
          logoImage: settings.logoImage ?? "",
        };

        setForm({
          address: settings.address,
          paymentTerms: settings.paymentTerms,
          footerContent: settings.footerContent,
        });
        setExistingLogoImage(settings.logoImage ?? "");
        setInitialSnapshot(snapshot);
        setLogoPreview("");
        setLogoFile(null);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const errors = useMemo(
    () => ({
      address: getRequiredError(form.address, "Address"),
      paymentTerms: getRequiredError(form.paymentTerms, "Payment Terms"),
      footerContent: getRequiredError(form.footerContent, "Invoice Footer Content"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: INVOICE_SETTINGS_FIELDS,
  });

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    if (logoFile) return true;

    return INVOICE_SETTINGS_FIELDS.some(
      (key) => String(form[key] ?? "").trim() !== String(initialSnapshot[key] ?? "").trim()
    );
  }, [form, initialSnapshot, logoFile]);

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isFormValidForFields(errors, INVOICE_SETTINGS_FIELDS) &&
    !isSubmitting &&
    !isLoading &&
    !loadFailed &&
    isDirty;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    if (
      readOnly ||
      !showSubmit ||
      !validateSubmit() ||
      !isFormValidForFields(errors, INVOICE_SETTINGS_FIELDS) ||
      !isDirty
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await updateInvoiceSettings({
        address: form.address,
        paymentTerms: form.paymentTerms,
        footerContent: form.footerContent,
        logoFile,
      });

      const updated = data.form ?? {
        address: form.address,
        paymentTerms: form.paymentTerms,
        footerContent: form.footerContent,
        logoImage: existingLogoImage,
      };

      const snapshot = {
        address: updated.address,
        paymentTerms: updated.paymentTerms,
        footerContent: updated.footerContent,
        logoImage: updated.logoImage ?? "",
      };

      setForm({
        address: updated.address,
        paymentTerms: updated.paymentTerms,
        footerContent: updated.footerContent,
      });
      setExistingLogoImage(updated.logoImage ?? "");
      setInitialSnapshot(snapshot);
      setLogoPreview("");
      setLogoFile(null);
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Invoice Settings"
          subtitle="Configure invoice branding and default content."
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load invoice settings.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Invoice Settings"
        subtitle="Configure invoice branding and default content."
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <TableCard title="Branding" isDarkMode={isDarkMode}>
          <LogoImageUpload
            isDarkMode={isDarkMode}
            preview={logoPreview}
            onPreviewChange={setLogoPreview}
            onFileChange={setLogoFile}
            existingImage={existingLogoImage}
            disabled={readOnly}
          />
        </TableCard>

        <TableCard title="Invoice Content" isDarkMode={isDarkMode}>
          <div className="flex max-w-3xl flex-col gap-5">
            <FormField
              label="Address"
              required
              error={showError("address")}
            >
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                onBlur={() => touch("address")}
                rows={5}
                readOnly={readOnly}
                disabled={readOnly || isSubmitting}
              />
            </FormField>
            <FormField
              label="Payment Terms"
              required
              error={showError("paymentTerms")}
            >
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                value={form.paymentTerms}
                onChange={(e) => setField("paymentTerms", e.target.value)}
                onBlur={() => touch("paymentTerms")}
                rows={4}
                readOnly={readOnly}
                disabled={readOnly || isSubmitting}
              />
            </FormField>
            <FormField
              label="Invoice Footer Content"
              required
              error={showError("footerContent")}
            >
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={form.footerContent}
                onChange={(e) => setField("footerContent", e.target.value)}
                onBlur={() => touch("footerContent")}
                rows={3}
                readOnly={readOnly}
                disabled={readOnly || isSubmitting}
              />
            </FormField>
          </div>
        </TableCard>

        <div className="flex flex-wrap items-center gap-3">
          {showSubmit && !readOnly && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/invoice/list")}
            disabled={isSubmitting}
            className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default InvoiceSettingsPage;
