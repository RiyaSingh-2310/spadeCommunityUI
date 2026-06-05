import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getEmailError,
  getRequiredError,
  isFormValid,
} from "../../shared/utils/validation";

const RFQ_FORM_FIELDS = [
  "clientName",
  "email",
  "country",
  "subject",
  "status",
  "comment",
];

function AddRfqPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clientName: "",
    email: "",
    country: "",
    subject: "",
    status: "",
    comment: "",
  });

  const errors = useMemo(
    () => ({
      clientName: getRequiredError(form.clientName, "Client Name"),
      email: getEmailError(form.email),
      country: getRequiredError(form.country, "Country"),
      subject: getRequiredError(form.subject, "Subject"),
      status: getRequiredError(form.status, "Status"),
      comment: getRequiredError(form.comment, "Comment"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: RFQ_FORM_FIELDS,
  });

  const canSubmit = isFormValid(errors);

  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${
    isDarkMode
      ? "border-[#344662] bg-[#101a2a] text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
      : "border-[#d8e3ef] bg-white text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
  }`;

  const renderField = (label, key, placeholder, type = "text") => (
    <div>
      <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
      <input
        type={type}
        className={inputClass}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        onBlur={() => touch(key)}
      />
      {showError(key) && (
        <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError(key)}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Add RFQ"
        breadcrumbs={[
          { label: "Sales", to: "/sales/rfq" },
          { label: "RFQ", to: "/sales/rfq" },
          { label: "Add RFQ" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="RFQ Details" isDarkMode={isDarkMode}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!validateSubmit() || !canSubmit) return;
            navigate("/sales/rfq");
          }}
          noValidate
        >
          <div className="grid gap-4 md:grid-cols-2">
            {renderField("Client Name", "clientName", "Enter Name")}
            {renderField("Email Address", "email", "Enter Email Address", "email")}
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Country</label>
              <select
                className={inputClass}
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                onBlur={() => touch("country")}
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
            {renderField("Subject", "subject", "Enter Subject")}
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                onBlur={() => touch("status")}
              >
                <option value="">Select Status</option>
                <option value="WIP">Work In Progress (WIP)</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
              {showError("status") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("status")}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">Comment</label>
              <textarea
                className={`${inputClass} h-28 py-2`}
                placeholder="Enter Comment"
                value={form.comment}
                onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                onBlur={() => touch("comment")}
              />
              {showError("comment") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("comment")}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => navigate("/sales/rfq")}
              className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default AddRfqPage;
