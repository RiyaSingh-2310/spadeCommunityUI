import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import TableCard from "../../components/admin/TableCard";

const demoClient = {
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
};

function ClientFormPage({ isDarkMode, mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(isEdit ? demoClient : {
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
  });
  const [showSecret, setShowSecret] = useState(false);

  const canSubmit = useMemo(
    () =>
      form.name.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.country.trim().length > 0 &&
      form.contactPerson.trim().length > 0 &&
      form.contactNumber.trim().length > 0 &&
      form.website.trim().length > 0,
    [form]
  );

  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${
    isDarkMode
      ? "border-[#344662] bg-[#101a2a] text-[#f8fafc] placeholder:text-[#8ea5c2]"
      : "border-[#d8e3ef] bg-white text-[#1f2b3d] placeholder:text-[#8b98ab]"
  }`;

  const onSubmit = (event) => {
    event.preventDefault();
    navigate("/clients");
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={isEdit ? "Edit Client User" : "Add Client User"}
        subtitle={isEdit ? `Editing client #${id}` : undefined}
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5">
        <TableCard title="Basic Information" isDarkMode={isDarkMode}>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Name", "name"],
              ["Email", "email"],
              ["Contact Person", "contactPerson"],
              ["Contact Number", "contactNumber"],
              ["Website URL", "website"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className={`mb-2 block text-sm font-semibold ${isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"}`}>{label}</label>
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
                />
              </div>
            ))}
            <div>
              <label className={`mb-2 block text-sm font-semibold ${isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"}`}>Select Country</label>
              <select className={inputClass} value={form.country} onChange={(e) => setField("country", e.target.value)}>
                <option value="">Select Country</option>
                <option value="India">India</option>
                <option value="UAE">UAE</option>
                <option value="USA">USA</option>
              </select>
            </div>
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
                <label className={`mb-2 block text-sm font-semibold ${isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"}`}>{label}</label>
                <input
                  className={inputClass}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                />
              </div>
            ))}
            <div>
              <label className={`mb-2 block text-sm font-semibold ${isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"}`}>API Secret Key</label>
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
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-[#8ea5c2]" : "text-[#8b98ab]"}`}
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
            isDarkMode ? "bg-[#1f3047] text-[#e2e8f0]" : "bg-[#eef4fb] text-[#2f3b4d]"
          }`}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClientFormPage;
