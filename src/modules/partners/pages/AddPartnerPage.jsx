import { useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormStatusSelect from "../../../components/admin/FormStatusSelect";
import NumericInput from "../../../components/admin/NumericInput";
import PhoneInput from "../../../components/admin/PhoneInput";
import ProfileImageUpload from "../../../components/admin/ProfileImageUpload";
import TableCard from "../../../components/admin/TableCard";
import { getDefaultPhoneCountryCode } from "../../shared/data/phoneCountries";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getEmailError,
  getPhoneError,
  getRequiredError,
  getUrlError,
  isFormValid,
} from "../../shared/utils/validation";

const PARTNER_FORM_FIELDS = [
  "name",
  "email",
  "country",
  "contactPerson",
  "contactNumber",
  "website",
  "panelSize",
  "terminateOverQuota",
  "qualityTermSurveyClose",
  "aboutPartner",
];

function AddPartnerPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [showSecret, setShowSecret] = useState(false);
  const [preview, setPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    country: "",
    contactPerson: "",
    contactNumber: "",
    website: "",
    panelSize: "",
    terminateOverQuota: "",
    qualityTermSurveyClose: "",
    aboutPartner: "",
    apiBaseUrl: "",
    apiSecretKey: "",
    apiBody: "",
    status: "Active",
  });

  const errors = useMemo(
    () => ({
      name: getRequiredError(form.name, "Name"),
      email: getEmailError(form.email),
      country: getRequiredError(form.country, "Country"),
      contactPerson: getRequiredError(form.contactPerson, "Contact Person"),
      contactNumber: getPhoneError(form.contactNumber, {
        required: true,
        label: "Contact Number",
        defaultCountryCode: getDefaultPhoneCountryCode(form.country),
      }),
      website: getUrlError(form.website, { required: true }),
      panelSize: getRequiredError(form.panelSize, "Panel Size"),
      terminateOverQuota: getRequiredError(
        form.terminateOverQuota,
        "Complete Terminate Over Quota"
      ),
      qualityTermSurveyClose: getRequiredError(
        form.qualityTermSurveyClose,
        "Quality Term Survey Close"
      ),
      aboutPartner: getRequiredError(form.aboutPartner, "About Partner"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: PARTNER_FORM_FIELDS,
  });

  const canSubmit = isFormValid(errors) && !isSubmitting;

  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${
    isDarkMode
      ? "border-[#344662] bg-[#101a2a] text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
      : "border-[#d8e3ef] bg-white text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
  }`;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const numericFieldKeys = new Set(["panelSize", "terminateOverQuota", "qualityTermSurveyClose"]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !validateSubmit() || !isFormValid(errors)) return;

    setIsSubmitting(true);
    try {
      navigate("/partners");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Add Partner"
        breadcrumbs={[
          { label: "Partners", to: "/partners" },
          { label: "Add Partner" },
        ]}
        isDarkMode={isDarkMode}
      />

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <TableCard title="Basic Information" isDarkMode={isDarkMode}>
          <div className="mb-4">
            <ProfileImageUpload
              isDarkMode={isDarkMode}
              preview={preview}
              onPreviewChange={setPreview}
              name={form.name}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Name", "name", "Enter Name", "text"],
              ["Email Address", "email", "Enter Email Address", "email"],
              ["Contact Person", "contactPerson", "Enter Contact Person", "text"],
              ["Website URL", "website", "Enter Website URL", "url"],
              ["Panel Size", "panelSize", "Enter Panel Size", "numeric"],
              [
                "Complete Terminate Over Quota",
                "terminateOverQuota",
                "Enter Complete Terminate Over Quota",
                "numeric",
              ],
              [
                "Quality Term Survey Close",
                "qualityTermSurveyClose",
                "Enter Quality Term Survey Close",
                "numeric",
              ],
            ].map(([label, key, placeholder, fieldType]) => (
              <div key={key}>
                <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
                {fieldType === "numeric" ? (
                  <NumericInput
                    className={inputClass}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(v) => setField(key, v)}
                    onBlur={() => touch(key)}
                    disabled={isSubmitting}
                  />
                ) : (
                  <input
                    className={inputClass}
                    type={fieldType === "email" ? "email" : "text"}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    onBlur={() => touch(key)}
                    disabled={isSubmitting}
                  />
                )}
                {showError(key) && (
                  <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError(key)}</p>
                )}
              </div>
            ))}
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Contact Number</label>
              <PhoneInput
                value={form.contactNumber}
                onChange={(next) => setField("contactNumber", next)}
                onBlur={() => touch("contactNumber")}
                disabled={isSubmitting}
                formCountryLabel={form.country}
                inputClassName={inputClass}
                placeholder="Enter phone number"
              />
              {showError("contactNumber") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">
                  {showError("contactNumber")}
                </p>
              )}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Select Country</label>
              <select
                className={inputClass}
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
                onBlur={() => touch("country")}
                disabled={isSubmitting}
              >
                <option value="">Select Country</option>
                <option value="India">India</option>
                <option value="UAE">UAE</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
              </select>
              {showError("country") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("country")}</p>
              )}
            </div>
            <FormStatusSelect
              value={form.status}
              onChange={(status) => setField("status", status)}
              inputClass={inputClass}
            />
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">About Partner</label>
              <textarea
                className={`${inputClass} h-24 py-2`}
                placeholder="Enter About Partner"
                value={form.aboutPartner}
                onChange={(e) => setField("aboutPartner", e.target.value)}
                onBlur={() => touch("aboutPartner")}
                disabled={isSubmitting}
              />
              {showError("aboutPartner") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">
                  {showError("aboutPartner")}
                </p>
              )}
            </div>
          </div>
        </TableCard>

        <TableCard title="API Information (Optional)" isDarkMode={isDarkMode}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">API Base URL</label>
              <input
                className={inputClass}
                placeholder="Enter API Base URL"
                value={form.apiBaseUrl}
                onChange={(e) => setField("apiBaseUrl", e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">API Secret Key</label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="Enter API Secret Key"
                  value={form.apiSecretKey}
                  onChange={(e) => setField("apiSecretKey", e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((prev) => !prev)}
                  className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                  disabled={isSubmitting}
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">API Body</label>
              <textarea
                className={`${inputClass} h-24 py-2`}
                placeholder="Enter API Body"
                value={form.apiBody}
                onChange={(e) => setField("apiBody", e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </TableCard>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/partners")}
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

export default AddPartnerPage;
