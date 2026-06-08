import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import LogoImageUpload from "../../../components/admin/LogoImageUpload";
import TableCard from "../../../components/admin/TableCard";
import { useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getRequiredError, isFormValid } from "../../shared/utils/validation";

const INVOICE_SETTINGS_FIELDS = ["address", "paymentTerms", "footerContent"];

const DEFAULT_ADDRESS = `Spade Community Pvt. Ltd.
123 Business Park, Sector 18
Gurugram, Haryana 122015
India`;

const DEFAULT_PAYMENT_TERMS = `Payment is due within 30 days of invoice date.
Late payments may incur a 1.5% monthly interest charge.
All amounts are in USD unless stated otherwise.`;

const DEFAULT_FOOTER = `Thank you for your business.
For billing inquiries, contact accounts@spadecommunity.com
This is a computer-generated invoice.`;

function InvoiceSettingsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [logoPreview, setLogoPreview] = useState("");
  const [form, setForm] = useState({
    address: DEFAULT_ADDRESS,
    paymentTerms: DEFAULT_PAYMENT_TERMS,
    footerContent: DEFAULT_FOOTER,
  });
  const { readOnly, showSubmit } = useFormAccess();
  const inputClass = getAdminInputClass();

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

  const canSubmit = showSubmit && !readOnly && isFormValid(errors);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (event) => {
    event.preventDefault();
    if (readOnly || !showSubmit || !validateSubmit() || !canSubmit) return;
    navigate("/invoice/settings", { replace: true });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Invoice Settings"
        subtitle="Configure invoice branding and default content."
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5">
        <TableCard title="Branding" isDarkMode={isDarkMode}>
          <LogoImageUpload
            isDarkMode={isDarkMode}
            preview={logoPreview}
            onPreviewChange={setLogoPreview}
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
                disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
              />
            </FormField>
          </div>
        </TableCard>

        <div className="flex flex-wrap items-center gap-3">
          {showSubmit && !readOnly && (
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit
          </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/invoice/list")}
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
