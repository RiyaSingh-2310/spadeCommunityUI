import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";

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

  const canSubmit = useMemo(
    () =>
      form.clientName.trim() &&
      form.email.trim() &&
      form.country.trim() &&
      form.subject.trim() &&
      form.status.trim() &&
      form.comment.trim(),
    [form]
  );

  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${
    isDarkMode
      ? "border-[#344662] bg-[#101a2a] text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
      : "border-[#d8e3ef] bg-white text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
  }`;

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
            if (!canSubmit) return;
            navigate("/sales/rfq");
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Client Name</label>
              <input className={inputClass} placeholder="Enter Name" value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} />
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Email Address</label>
              <input className={inputClass} placeholder="Enter Email Address" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Country</label>
              <select className={inputClass} value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}>
                <option value="">Select Country</option>
                <option value="India">India</option>
                <option value="UAE">UAE</option>
                <option value="USA">USA</option>
              </select>
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Subject</label>
              <input className={inputClass} placeholder="Enter Subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} />
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="">Select Status</option>
                <option value="WIP">Work In Progress (WIP)</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">Comment</label>
              <textarea className={`${inputClass} h-28 py-2`} placeholder="Enter Comment" value={form.comment} onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={!canSubmit} className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]">
              Submit
            </button>
            <button type="button" onClick={() => navigate("/sales/rfq")} className={`h-11 rounded-xl px-5 text-sm font-semibold ${isDarkMode ? "bg-[#1f3047] text-[var(--admin-foreground)]" : "bg-[#eef4fb] text-[var(--admin-foreground)]"}`}>
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default AddRfqPage;
