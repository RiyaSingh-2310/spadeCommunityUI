import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormStatusSelect from "../../../components/admin/FormStatusSelect";
import NumericInput from "../../../components/admin/NumericInput";
import PhoneInput from "../../../components/admin/PhoneInput";
import ProfileImageUpload from "../../../components/admin/ProfileImageUpload";
import TableCard from "../../../components/admin/TableCard";
import { getDefaultPhoneCountryCode } from "../../shared/data/phoneCountries";
import { useAdminFormAccess } from "../../permissions/FormAccessContext";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  createPartner,
  getRecord,
  mapPartnerToForm,
  updatePartner,
} from "../../../services/partners/partnersApi";
import {
  getEmailError,
  getPhoneError,
  getRequiredError,
  getUrlError,
  isFormValid,
} from "../../shared/utils/validation";

const PARTNER_FORM_FIELDS = [
  "code",
  "name",
  "email",
  "country",
  "contactPerson",
  "contactNumber",
  "website",
  "panelSize",
  "complete",
  "terminate",
  "overQuota",
  "qualityTerm",
  "surveyClose",
  "aboutPartner",
];

const EMPTY_FORM = {
  code: "",
  name: "",
  email: "",
  country: "",
  contactPerson: "",
  contactNumber: "",
  website: "",
  panelSize: "",
  complete: "",
  terminate: "",
  overQuota: "",
  qualityTerm: "",
  surveyClose: "",
  aboutPartner: "",
  apiBaseUrl: "",
  apiSecretKey: "",
  apiBody: "",
  status: "Active",
};

function AddPartnerPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [showSecret, setShowSecret] = useState(false);
  const [preview, setPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { readOnly, showSubmit, controlDisabled, canSubmitForm, fieldDisabled } =
    useAdminFormAccess(isSubmitting);

  const errors = useMemo(
    () => ({
      code: isEdit ? "" : getRequiredError(form.code, "Partner Code"),
      name: getRequiredError(form.name, "Name"),
      email: isEdit ? "" : getEmailError(form.email),
      country: getRequiredError(form.country, "Country"),
      contactPerson: getRequiredError(form.contactPerson, "Contact Person"),
      contactNumber: getPhoneError(form.contactNumber, {
        required: true,
        label: "Contact Number",
        defaultCountryCode: getDefaultPhoneCountryCode(form.country),
      }),
      website: getUrlError(form.website, { required: true }),
      panelSize: getRequiredError(form.panelSize, "Panel Size"),
      complete: getRequiredError(form.complete, "Complete"),
      terminate: getRequiredError(form.terminate, "Terminate"),
      overQuota: getRequiredError(form.overQuota, "Over Quota"),
      qualityTerm: getRequiredError(form.qualityTerm, "Quality Term"),
      surveyClose: getRequiredError(form.surveyClose, "Survey Close"),
      aboutPartner: getRequiredError(form.aboutPartner, "About Partner"),
    }),
    [form, isEdit]
  );

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: PARTNER_FORM_FIELDS,
  });

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadPartner = async () => {
      resetValidation();
      setForm(EMPTY_FORM);
      setPreview("");
      setIsLoadingRecord(true);
      setLoadFailed(false);
      try {
        const partner = await getRecord(id);
        if (cancelled) return;
        setForm(mapPartnerToForm(partner));
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadPartner();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, resetValidation]);

  const canSubmit =
    canSubmitForm && isFormValid(errors) && !isLoadingRecord && !loadFailed;

  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${
    isDarkMode
      ? "border-[#344662] bg-[#101a2a] text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
      : "border-[#d8e3ef] bg-white text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
  }`;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || isLoadingRecord || readOnly || !showSubmit || !validateSubmit() || !isFormValid(errors)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = isEdit
        ? await updatePartner(id, form)
        : await createPartner(form);
      toastApiSuccess(data);
      navigate("/partners", {
        replace: true,
        state: {
          flash: data.message ? { type: "success", message: data.message } : null,
          refresh: true,
        },
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && isLoadingRecord) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-5">
        <AdminPageHeader
          title="Edit Partner"
          breadcrumbs={[
            { label: "Partners", to: "/partners" },
            { label: "Edit Partner" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load partner details.
          <button
            type="button"
            onClick={() => navigate("/partners")}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Back to Partners
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={isEdit ? "Edit Partner" : "Add Partner"}
        breadcrumbs={[
          { label: "Partners", to: "/partners" },
          { label: isEdit ? "Edit Partner" : "Add Partner" },
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
              ["Partner Code", "code", "Enter Partner Code", "text"],
              ["Name", "name", "Enter Name", "text"],
              ["Email Address", "email", "Enter Email Address", "email"],
              ["Contact Person", "contactPerson", "Enter Contact Person", "text"],
              ["Website URL", "website", "Enter Website URL", "url"],
              ["Panel Size", "panelSize", "Enter Panel Size", "numeric"],
              ["Complete", "complete", "Enter Complete", "numeric"],
              ["Terminate", "terminate", "Enter Terminate", "numeric"],
              ["Over Quota", "overQuota", "Enter Over Quota", "numeric"],
              ["Quality Term", "qualityTerm", "Enter Quality Term", "numeric"],
              ["Survey Close", "surveyClose", "Enter Survey Close", "numeric"],
            ].map(([label, key, placeholder, fieldType]) => {
              const readOnlyField = readOnly || (isEdit && (key === "code" || key === "email"));
              return (
                <div key={key}>
                  <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
                  {fieldType === "numeric" ? (
                    <NumericInput
                      className={inputClass}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(v) => setField(key, v)}
                      onBlur={() => touch(key)}
                      disabled={fieldDisabled(readOnlyField)}
                    />
                  ) : (
                    <input
                      className={`${inputClass}${readOnlyField ? " cursor-not-allowed opacity-70" : ""}`}
                      type={fieldType === "email" ? "email" : "text"}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      onBlur={() => touch(key)}
                      disabled={fieldDisabled(readOnlyField)}
                      readOnly={readOnlyField}
                    />
                  )}
                  {showError(key) && (
                    <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError(key)}</p>
                  )}
                </div>
              );
            })}
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Contact Number</label>
              <PhoneInput
                value={form.contactNumber}
                onChange={(next) => setField("contactNumber", next)}
                onBlur={() => touch("contactNumber")}
                disabled={controlDisabled}
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
                disabled={controlDisabled}
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
                disabled={controlDisabled}
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
                disabled={controlDisabled}
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
                  disabled={controlDisabled}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((prev) => !prev)}
                  className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                  disabled={controlDisabled}
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
                disabled={controlDisabled}
              />
            </div>
          </div>
        </TableCard>

        <div className="flex items-center gap-3">
          {showSubmit && !readOnly && (
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting
              ? isEdit
                ? "Updating..."
                : "Submitting..."
              : isEdit
                ? "Update"
                : "Submit"}
          </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/partners")}
            disabled={controlDisabled}
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
