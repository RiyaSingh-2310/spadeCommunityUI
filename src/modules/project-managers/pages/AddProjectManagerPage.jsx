import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";

function AddProjectManagerPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const mismatch = form.password && form.confirmPassword && form.password !== form.confirmPassword;
  const canSubmit = useMemo(
    () =>
      form.name.trim() &&
      form.email.trim() &&
      form.password.trim() &&
      form.confirmPassword.trim() &&
      !mismatch,
    [form, mismatch]
  );

  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${
    isDarkMode
      ? "border-[#344662] bg-[#101a2a] text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
      : "border-[#d8e3ef] bg-white text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
  }`;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Add Project Manager"
        breadcrumbs={[
          { label: "Project Managers", to: "/project-managers" },
          { label: "Add Project Manager" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Project Manager Details" isDarkMode={isDarkMode}>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Name</label>
              <input className={inputClass} placeholder="Enter Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Email Address</label>
              <input className={inputClass} placeholder="Enter Email Address" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">New Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className={`${inputClass} pr-10`} placeholder="Enter New Password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} className={`${inputClass} pr-10`} placeholder="Confirm New Password" value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
                <button type="button" onClick={() => setShowConfirm((prev) => !prev)} className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mismatch && <p className="mt-1 text-xs text-[var(--admin-danger-text)]">Passwords must match.</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button disabled={!canSubmit} className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]">
              Submit
            </button>
            <button type="button" onClick={() => navigate("/project-managers")} className={`h-11 rounded-xl px-5 text-sm font-semibold ${isDarkMode ? "bg-[#1f3047] text-[var(--admin-foreground)]" : "bg-[#eef4fb] text-[var(--admin-foreground)]"}`}>
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default AddProjectManagerPage;
