import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FormStatusSelect from "../../components/admin/FormStatusSelect";
import PhoneInput from "../../components/admin/PhoneInput";
import ProfileImageUpload from "../../components/admin/ProfileImageUpload";
import TableCard from "../../components/admin/TableCard";
import { toastApiError } from "../../services/toast/apiToast";
import {
  createClient,
  mapClientToForm,
  updateClient,
} from "../../services/clients/clientsApi";
import { getDefaultPhoneCountryCode } from "../../modules/shared/data/phoneCountries";
import { getAdminInputClass } from "../../modules/shared/utils/formStyles";
import { useFormValidation } from "../../modules/shared/hooks/useFormValidation";
import {
  getEmailError,
  getPhoneError,
  getRequiredError,
  getUrlError,
  isFormValid,
} from "../../modules/shared/utils/validation";

const CLIENT_FORM_FIELDS = [
  "name",
  "email",
  "contactPerson",
  "contactNumber",
  "website",
  "country",
];

const CLIENT_NAMES = ["Alpha Corp", "Beta Labs", "Gamma Tech", "Delta Works", "Epsilon Ltd"];
const COUNTRIES = ["India", "UAE", "USA", "UK", "Canada"];

function getDemoClientById(clientId) {
  const numId = Number(clientId);
  if (!Number.isFinite(numId) || numId < 1) {
    return {
      name: "Alpha Corp",
      email: "ops@alpha.com",
      country: "India",
      contactPerson: "Riya Sharma",
      contactNumber: "+91 9876543210",
      website: "https://alpha.com",
      apiBaseUrl: "https://api.alpha.com",
      apiSecretKey: "alpha-secret-key",
      passwordType: "Bearer",
      apiHeaderKey: "Authorization",
      status: "Active",
      image: "https://i.pravatar.cc/80?img=15",
    };
  }
  return {
    name: CLIENT_NAMES[(numId - 1) % CLIENT_NAMES.length],
    email: `contact${numId}@client.com`,
    country: COUNTRIES[(numId - 1) % COUNTRIES.length],
    contactPerson: `Contact ${numId}`,
    contactNumber: `+1 555${String(1000 + numId - 1).slice(-4)}`,
    website: `https://client${numId}.com`,
    apiBaseUrl: `https://api.client${numId}.com`,
    apiSecretKey: `client-${numId}-secret`,
    passwordType: "Bearer",
    apiHeaderKey: "Authorization",
    status: numId % 5 === 0 ? "Inactive" : "Active",
    image: numId % 3 === 0 ? `https://i.pravatar.cc/80?img=${20 + numId - 1}` : "",
  };
}

function ClientFormPage({ isDarkMode, mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(() =>
    isEdit
      ? getDemoClientById(id)
      : {
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
        }
  );
  const [showSecret, setShowSecret] = useState(false);
  const [preview, setPreview] = useState("");
  const [existingImage, setExistingImage] = useState(
    isEdit ? getDemoClientById(id).image : ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClass = getAdminInputClass();

  useEffect(() => {
    if (!isEdit || !id) return undefined;
    const demo = getDemoClientById(id);
    setForm(mapClientToForm(demo));
    setExistingImage(demo.image || "");
    return undefined;
  }, [isEdit, id]);

  const errors = useMemo(() => {
    const phoneCountry = getDefaultPhoneCountryCode(form.country);
    const apiFields = {
      name: getRequiredError(form.name, "Name"),
      country: getRequiredError(form.country, "Country"),
      contactNumber: getPhoneError(form.contactNumber, {
        required: true,
        label: "Contact Number",
        defaultCountryCode: phoneCountry,
      }),
      website: form.website.trim()
        ? getUrlError(form.website, { required: false })
        : "",
    };

    if (!isEdit) {
      return {
        ...apiFields,
        email: getEmailError(form.email),
        contactPerson: "",
      };
    }

    return {
      ...apiFields,
      email: "",
      contactPerson: "",
    };
  }, [form, isEdit]);

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: CLIENT_FORM_FIELDS,
  });

  const canSubmit = isFormValid(errors) && !isSubmitting;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors)) return;

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
          <div className="mb-4">
            <ProfileImageUpload
              isDarkMode={isDarkMode}
              preview={preview}
              onPreviewChange={setPreview}
              existingImage={existingImage}
              showCurrentLabel={isEdit}
              name={form.name}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Name", "name", true],
              ["Email", "email", !isEdit],
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
                  disabled={isSubmitting || (isEdit && key === "email")}
                  readOnly={isEdit && key === "email"}
                />
                {showError(key) && (
                  <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError(key)}</p>
                )}
              </div>
            ))}
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Contact Number
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
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
              <label className="admin-text mb-2 block text-sm font-semibold">
                Select Country
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
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
          </div>
        </TableCard>

        <TableCard title="API Information (Optional)" isDarkMode={isDarkMode}>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["API Base URL", "apiBaseUrl", "Enter API Base URL"],
              ["Password Type", "passwordType", "Enter Password Type"],
              ["API Header Key", "apiHeaderKey", "Enter API Header Key"],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
                <input
                  className={inputClass}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                />
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
          <button
            type="button"
            onClick={() => navigate("/clients")}
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

export default ClientFormPage;
