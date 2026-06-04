import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormStatusSelect from "../../../components/admin/FormStatusSelect";
import ProfileImageUpload from "../../../components/admin/ProfileImageUpload";
import NumericInput from "../../../components/admin/NumericInput";
import TableCard from "../../../components/admin/TableCard";

function AddPartnerPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [showSecret, setShowSecret] = useState(false);
  const [preview, setPreview] = useState("");
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

  const canSubmit = useMemo(
    () =>
      form.name &&
      form.email &&
      form.country &&
      form.contactPerson &&
      form.contactNumber &&
      form.website &&
      form.panelSize &&
      form.terminateOverQuota &&
      form.qualityTermSurveyClose &&
      form.aboutPartner,
    [form]
  );

  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${
    isDarkMode
      ? "border-[#344662] bg-[#101a2a] text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
      : "border-[#d8e3ef] bg-white text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
  }`;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const numericFieldKeys = new Set(["panelSize", "terminateOverQuota", "qualityTermSurveyClose"]);

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

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          navigate("/partners");
        }}
      >
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
              ["Name", "name", "Enter Name"],
              ["Email Address", "email", "Enter Email Address"],
              ["Contact Person", "contactPerson", "Enter Contact Person"],
              ["Contact Number", "contactNumber", "Enter Contact Number"],
              ["Website URL", "website", "Enter Website URL"],
              ["Panel Size", "panelSize", "Enter Panel Size"],
              ["Complete Terminate Over Quota", "terminateOverQuota", "Enter Complete Terminate Over Quota"],
              ["Quality Term Survey Close", "qualityTermSurveyClose", "Enter Quality Term Survey Close"],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
                {numericFieldKeys.has(key) ? (
                  <NumericInput
                    className={inputClass}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(v) => setField(key, v)}
                  />
                ) : (
                  <input
                    className={inputClass}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                )}
              </div>
            ))}
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Select Country</label>
              <select className={inputClass} value={form.country} onChange={(e) => setField("country", e.target.value)}>
                <option value="">Select Country</option>
                <option value="India">India</option>
                <option value="UAE">UAE</option>
                <option value="USA">USA</option>
              </select>
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
              />
            </div>
          </div>
        </TableCard>

        <TableCard title="API Information (Optional)" isDarkMode={isDarkMode}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">API Base URL</label>
              <input className={inputClass} placeholder="Enter API Base URL" value={form.apiBaseUrl} onChange={(e) => setField("apiBaseUrl", e.target.value)} />
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
                />
                <button type="button" onClick={() => setShowSecret((prev) => !prev)} className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2">
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
              />
            </div>
          </div>
        </TableCard>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={!canSubmit} className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]">
            Submit
          </button>
          <button type="button" onClick={() => navigate("/partners")} className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPartnerPage;
