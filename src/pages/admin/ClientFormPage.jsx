import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FormStatusSelect from "../../components/admin/FormStatusSelect";
import ProfileImageUpload from "../../components/admin/ProfileImageUpload";
import TableCard from "../../components/admin/TableCard";
import { getAdminInputClass } from "../../modules/shared/utils/formStyles";
import {
  getEmailError,
  getRequiredError,
  getUrlError,
  isFormValid,
} from "../../modules/shared/utils/validation";

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
  const [existingImage] = useState(isEdit ? getDemoClientById(id).image : "");

  const [touched, setTouched] = useState(false);
  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      name: getRequiredError(form.name, "Name"),
      email: getEmailError(form.email),
      country: getRequiredError(form.country, "Country"),
      contactPerson: getRequiredError(form.contactPerson, "Contact Person"),
      contactNumber: getRequiredError(form.contactNumber, "Contact Number"),
      website: getUrlError(form.website, { required: true }),
    }),
    [form]
  );

  const canSubmit = isFormValid(errors);

  const onSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    navigate("/clients");
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

      <form onSubmit={onSubmit} className="space-y-5">
        <TableCard title="Basic Information" isDarkMode={isDarkMode}>
          <div className="mb-4">
            <ProfileImageUpload
              isDarkMode={isDarkMode}
              preview={preview}
              onPreviewChange={setPreview}
              existingImage={existingImage}
              showCurrentLabel={isEdit}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Name", "name"],
              ["Email", "email"],
              ["Contact Person", "contactPerson"],
              ["Contact Number", "contactNumber"],
              ["Website URL", "website"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
                <input
                  className={inputClass}
                  placeholder={
                    key === "name"
                      ? "Enter Name"
                      : key === "email"
                        ? "Enter Email Address"
                        : key === "contactPerson"
                          ? "Enter Contact Person"
                          : key === "contactNumber"
                            ? "Enter Contact Number"
                            : "Enter Website URL"
                  }
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  onBlur={() => setTouched(true)}
                />
                {touched && errors[key] && (
                  <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{errors[key]}</p>
                )}
              </div>
            ))}
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Select Country</label>
              <select
                className={inputClass}
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
                onBlur={() => setTouched(true)}
              >
                <option value="">Select Country</option>
                <option value="India">India</option>
                <option value="UAE">UAE</option>
                <option value="USA">USA</option>
              </select>
              {touched && errors.country && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{errors.country}</p>
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
            className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
          >
            Submit
          </button>
          <button type="button" onClick={() => navigate("/clients")} className={`h-11 rounded-xl px-5 text-sm font-semibold ${
            isDarkMode ? "bg-[#1f3047] text-[var(--admin-foreground)]" : "bg-[#eef4fb] text-[var(--admin-foreground)]"
          }`}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClientFormPage;
