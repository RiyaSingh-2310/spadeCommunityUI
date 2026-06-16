import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import CountrySelect from "../../components/admin/CountrySelect";
import PhoneInput from "../../components/admin/PhoneInput";
import TableCard from "../../components/admin/TableCard";
import { toastApiError } from "../../services/toast/apiToast";
import {
  createClient,
  getRecord,
  mapClientToForm,
  updateClient,
} from "../../services/clients/clientsApi";
import { getDefaultPhoneCountryCode } from "../../modules/shared/data/phoneCountries";
import { useAdminFormAccess } from "../../modules/permissions/FormAccessContext";
import { useFormValidation } from "../../modules/shared/hooks/useFormValidation";
import {
  getEmailError,
  getPhoneError,
  getOptionalUrlError,
  getRequiredError,
  getUrlError,
  isFormValid,
  isFormValidForFields,
} from "../../modules/shared/utils/validation";
import { getAdminInputClass } from "../../modules/shared/utils/formStyles";

const CLIENT_ADD_REQUIRED_FIELDS = [
  "name",
  "email",
  "country",
  "contactNumber",
];

const CLIENT_EDIT_REQUIRED_FIELDS = ["name", "email", "country", "contactNumber"];

const CLIENT_FORM_FIELDS = [
  "name",
  "email",
  "contactPerson",
  "contactNumber",
  "website",
  "country",
  "apiBaseUrl",
];

function ClientFormPage({ isDarkMode, mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const [form, setForm] = useState({
    name: "",
    email: "",
    country: "",
    contactPerson: "",
    contactNumber: "",
    website: "",
    apiBaseUrl: "",
    apiSecretKey: "",
    passwordType: "",
    apiHeaderKey: "",
    status: "Active",
  });
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { readOnly, showSubmit, controlDisabled, canSubmitForm, fieldDisabled } =
    useAdminFormAccess(isSubmitting);
  const inputClass = getAdminInputClass();

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;
    const loadClient = async () => {
      setIsLoadingRecord(true);
      setLoadFailed(false);
      setInitialSnapshot(null);
      try {
        const client = await getRecord(id);
        if (cancelled) return;
        const mapped = mapClientToForm(client);
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
    loadClient();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id]);

  const errors = useMemo(() => {
    const phoneCountry = getDefaultPhoneCountryCode(form.country);
    const shared = {
      name: getRequiredError(form.name, "Name"),
      country: getRequiredError(form.country, "Country"),
      contactNumber: getPhoneError(form.contactNumber, {
        required: true,
        label: "Contact Number",
        defaultCountryCode: phoneCountry,
      }),
      contactPerson: "",
    };

    const apiBaseUrlError = getOptionalUrlError(form.apiBaseUrl, "API Base URL");

    if (!isEdit) {
      return {
        ...shared,
        email: getEmailError(form.email),
        website: form.website.trim()
          ? getUrlError(form.website, { required: false })
          : "",
        apiBaseUrl: apiBaseUrlError,
      };
    }

    return {
      ...shared,
      email: "",
      website: form.website.trim()
        ? getUrlError(form.website, { required: false })
        : "",
      apiBaseUrl: apiBaseUrlError,
    };
  }, [form, isEdit]);

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: CLIENT_FORM_FIELDS,
  });

  const requiredFields = isEdit ? CLIENT_EDIT_REQUIRED_FIELDS : CLIENT_ADD_REQUIRED_FIELDS;
  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return CLIENT_FORM_FIELDS.some((key) => form[key] !== initialSnapshot[key]);
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    canSubmitForm &&
    isFormValid(errors) &&
    isFormValidForFields(errors, requiredFields) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed &&
    (!isEdit || isDirty);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (
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
      if (isEdit) {
        const data = await updateClient(id, {
          name: form.name,
          country: form.country,
          contact_no: form.contactNumber,
        });

        navigate("/clients", {
          replace: true,
          state: {
            flash: { type: "success", message: data.message },
            refresh: true,
          },
        });
        return;
      }

      const data = await createClient({
        name: form.name,
        email: form.email,
        country: form.country,
        contact_no: form.contactNumber,
      });

      navigate("/clients", {
        replace: true,
        state: {
          flash: { type: "success", message: data.message },
          refresh: true,
        },
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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
          title="Edit Client User"
          breadcrumbs={[
            { label: "Clients", to: "/clients" },
            { label: "Edit Client" },
          ]}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={isEdit ? "Edit Client User" : "Add Client User"}
        subtitle={isEdit ? `Editing client #${id}` : undefined}
        breadcrumbs={[
          { label: "Clients", to: "/clients" },
          { label: isEdit ? "Edit Client" : "Add Client" },
        ]}
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <TableCard title="Basic Information" isDarkMode={isDarkMode}>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Name", "name", true],
              ["Email Address", "email", true],
              ["Contact Person", "contactPerson", false],
              ["Website URL", "website", false],
            ].map(([label, key, required]) => (
              <div key={key}>
                <label className="admin-text mb-2 block text-sm font-semibold">
                  {label}
                  {required && (
                    <span className="text-[var(--admin-danger-text)]"> *</span>
                  )}
                </label>
                <input
                  className={`${inputClass} ${key === "email" && isEdit ? "opacity-70" : ""}`}
                  type={key === "email" ? "email" : "text"}
                  placeholder={
                    key === "name"
                      ? "Enter Name"
                      : key === "email"
                        ? "Enter Email Address"
                        : key === "contactPerson"
                          ? "Enter Contact Person"
                          : "Enter Website URL"
                  }
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  onBlur={() => touch(key)}
                  disabled={fieldDisabled(isEdit && key === "email")}
                  readOnly={isEdit && key === "email"}
                />
                {showError(key) && (
                  <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError(key)}</p>
                )}
              </div>
            ))}
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
          </div>
        </TableCard>

        <TableCard title="API Information (Optional)" isDarkMode={isDarkMode}>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["API Base URL", "apiBaseUrl", "Enter API Base URL"],
              ["API Header Key", "apiHeaderKey", "Enter API Header Key"],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
                <input
                  className={inputClass}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  onBlur={() => touch(key)}
                />
                {showError(key) && (
                  <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError(key)}</p>
                )}
              </div>
            ))}
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">API Secret Key</label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="Enter API Secret Key"
                  value={form.apiSecretKey}
                  onChange={(e) => setField("apiSecretKey", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((prev) => !prev)}
                  className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
            onClick={() => navigate("/clients")}
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

export default ClientFormPage;
