import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import NumericInput from "../../../components/admin/NumericInput";
import CountrySelect from "../../../components/admin/CountrySelect";
import PhoneInput from "../../../components/admin/PhoneInput";
import TableCard from "../../../components/admin/TableCard";
import { getDefaultPhoneCountryCode } from "../../shared/data/phoneCountries";
import { sanitizePositiveInteger } from "../../shared/utils/numericInputUtils";
import { useAdminFormAccess } from "../../permissions/FormAccessContext";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  createPartner,
  getRecord,
  mapPartnerToForm,
  PARTNER_PANEL_SIZE_MAX_DIGITS,
  updatePartner,
} from "../../../services/partners/partnersApi";
import {
  CONTACT_PERSON_MAX_LENGTH,
  EMAIL_FIELD_MAX_LENGTH,
  NAME_FIELD_MAX_LENGTH,
  getContactPersonError,
  getEmailError,
  getOptionalUrlError,
  getOptionalPositiveIntegerError,
  getPhoneError,
  getRequiredError,
  getRichTextError,
  getUrlError,
  getUserNameError,
  preventBlockedNameKeys,
  isFormValid,
  isFormValidForFields,
  limitTextInput,
} from "../../shared/utils/validation";
import { getAdminInputClass } from "../../shared/utils/formStyles";

const PARTNER_ADD_REQUIRED_FIELDS = [
  "name",
  "email",
  "country",
  "contactNumber",
  "panelSize",
];

const PARTNER_EDIT_REQUIRED_FIELDS = [
  "name",
  "email",
  "country",
  "contactNumber",
  "panelSize",
];

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
  "apiBaseUrl",
  "apiSecretKey",
  "apiBody",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { readOnly, showSubmit, controlDisabled, canSubmitForm, fieldDisabled } =
    useAdminFormAccess(isSubmitting);

  const errors = useMemo(() => {
    const shared = {
      name: getUserNameError(form.name),
      country: getRequiredError(form.country, "Country"),
      contactNumber: getPhoneError(form.contactNumber, {
        required: true,
        label: "Contact Number",
        defaultCountryCode: getDefaultPhoneCountryCode(form.country),
      }),
      contactPerson: getContactPersonError(form.contactPerson),
    };

    const apiBaseUrlError = getOptionalUrlError(form.apiBaseUrl, "API Base URL");
    const panelSizeError =
      getRequiredError(form.panelSize, "Panel Size") ||
      getOptionalPositiveIntegerError(form.panelSize, "Panel Size", {
        maxDigits: PARTNER_PANEL_SIZE_MAX_DIGITS,
      });

    if (!isEdit) {
      return {
        ...shared,
        code: "",
        email: getEmailError(form.email),
        website: form.website.trim()
          ? getUrlError(form.website, { required: false })
          : "",
        panelSize: panelSizeError,
        complete: getOptionalUrlError(form.complete, "Complete URL"),
        terminate: getOptionalUrlError(form.terminate, "Terminate URL"),
        overQuota: getOptionalUrlError(form.overQuota, "Over Quota URL"),
        qualityTerm: getOptionalUrlError(form.qualityTerm, "Quality Term URL"),
        surveyClose: getOptionalUrlError(form.surveyClose, "Survey Closed URL"),
        aboutPartner: "",
        apiBaseUrl: apiBaseUrlError,
      };
    }

    return {
      ...shared,
      code: "",
      email: "",
      website: form.website.trim()
        ? getUrlError(form.website, { required: false })
        : "",
      panelSize: panelSizeError,
      complete: getOptionalUrlError(form.complete, "Complete URL"),
      terminate: getOptionalUrlError(form.terminate, "Terminate URL"),
      overQuota: getOptionalUrlError(form.overQuota, "Over Quota URL"),
      qualityTerm: getOptionalUrlError(form.qualityTerm, "Quality Term URL"),
      surveyClose: getOptionalUrlError(form.surveyClose, "Survey Closed URL"),
      aboutPartner: form.aboutPartner.trim()
        ? getRichTextError(form.aboutPartner, "About Partner")
        : "",
      apiBaseUrl: apiBaseUrlError,
    };
  }, [form, isEdit]);

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
      setIsLoadingRecord(true);
      setLoadFailed(false);
      setInitialSnapshot(null);
      try {
        const partner = await getRecord(id);
        if (cancelled) return;
        const mapped = mapPartnerToForm(partner);
        setForm(mapped);
        setInitialSnapshot(mapped);
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

  const requiredFields = isEdit ? PARTNER_EDIT_REQUIRED_FIELDS : PARTNER_ADD_REQUIRED_FIELDS;
  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return PARTNER_FORM_FIELDS.some((key) => form[key] !== initialSnapshot[key]);
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    canSubmitForm &&
    isFormValid(errors) &&
    isFormValidForFields(errors, requiredFields) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed &&
    (!isEdit || isDirty);

  const inputClass = getAdminInputClass();

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      isSubmitting ||
      isLoadingRecord ||
      readOnly ||
      !showSubmit ||
      !validateSubmit() ||
      !isFormValid(errors) ||
      !isFormValidForFields(errors, requiredFields) ||
      (isEdit && !isDirty)
    ) {
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
      <div className="space-y-6">
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
    <div className="space-y-6">
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
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ...(isEdit ? [["Partner Code", "code", "Enter Partner Code", "text", false]] : []),
              ["Name", "name", "Enter Name", "text", true],
              ["Email Address", "email", "Enter Email Address", "email", true],
              ["Contact Person", "contactPerson", "Enter Contact Person", "text", false],
              ["Website URL", "website", "Enter Website URL", "url", false],
              ["Panel Size", "panelSize", "Enter Panel Size", "positiveNumeric", true],
              ["Complete URL", "complete", "Enter Complete URL", "text", false],
              ["Terminate URL", "terminate", "Enter Terminate URL", "text", false],
              ["Over Quota URL", "overQuota", "Enter Over Quota URL", "text", false],
              ["Quality Term URL", "qualityTerm", "Enter Quality Term URL", "text", false],
              ["Survey Closed URL", "surveyClose", "Enter Survey Closed URL", "text", false],
            ].map(([label, key, placeholder, fieldType, required]) => {
              const readOnlyField = readOnly || (isEdit && (key === "code" || key === "email"));
              return (
                <div key={key}>
                  <label className="admin-text mb-2 block text-sm font-semibold">
                    {label}
                    {required && (
                      <span className="text-[var(--admin-danger-text)]"> *</span>
                    )}
                  </label>
                  {fieldType === "numeric" || fieldType === "positiveNumeric" ? (
                    <NumericInput
                      className={inputClass}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(v) =>
                        setField(
                          key,
                          fieldType === "positiveNumeric"
                            ? sanitizePositiveInteger(
                                v,
                                key === "panelSize"
                                  ? PARTNER_PANEL_SIZE_MAX_DIGITS
                                  : undefined
                              )
                            : v
                        )
                      }
                      maxLength={
                        key === "panelSize" ? PARTNER_PANEL_SIZE_MAX_DIGITS : undefined
                      }
                      onBlur={() => touch(key)}
                      disabled={fieldDisabled(readOnlyField)}
                    />
                  ) : (
                    <input
                      className={`${inputClass}${readOnlyField ? " cursor-not-allowed opacity-70" : ""}`}
                      type={fieldType === "email" ? "email" : "text"}
                      placeholder={placeholder}
                      value={form[key]}
                      maxLength={
                        key === "name"
                          ? NAME_FIELD_MAX_LENGTH
                          : key === "email"
                            ? EMAIL_FIELD_MAX_LENGTH
                            : key === "contactPerson"
                              ? CONTACT_PERSON_MAX_LENGTH
                              : undefined
                      }
                      onChange={(e) =>
                        setField(
                          key,
                          key === "name"
                            ? limitTextInput(e.target.value, NAME_FIELD_MAX_LENGTH)
                            : key === "email"
                              ? limitTextInput(e.target.value, EMAIL_FIELD_MAX_LENGTH)
                              : key === "contactPerson"
                                ? limitTextInput(e.target.value, CONTACT_PERSON_MAX_LENGTH)
                                : e.target.value
                        )
                      }
                      onKeyDown={key === "name" ? preventBlockedNameKeys : undefined}
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
              <label className="admin-text mb-2 block text-sm font-semibold">
                Select Country
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <CountrySelect
                inputClass={inputClass}
                value={form.country}
                onChange={(country) => setField("country", country)}
                onBlur={() => touch("country")}
                disabled={controlDisabled}
              />
              {showError("country") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("country")}</p>
              )}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Contact Number
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
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
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">
                About Partner
              </label>
              <textarea
                className={`${inputClass} min-h-[200px] resize-y py-3`}
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
                onBlur={() => touch("apiBaseUrl")}
                disabled={controlDisabled}
              />
              {showError("apiBaseUrl") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">
                  {showError("apiBaseUrl")}
                </p>
              )}
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
