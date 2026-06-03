import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormStatusSelect from "../../../components/admin/FormStatusSelect";
import ProfileImageUpload from "../../../components/admin/ProfileImageUpload";
import TableCard from "../../../components/admin/TableCard";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import {
  getConfirmPasswordError,
  getEmailError,
  getPasswordError,
  getRequiredError,
  isFormValid,
} from "../../shared/utils/validation";

function AddProjectManagerPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    status: "Active",
  });

  const [touched, setTouched] = useState(false);
  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      name: getRequiredError(form.name, "Name"),
      email: getEmailError(form.email),
      password: getPasswordError(form.password),
      confirmPassword: getConfirmPasswordError(form.password, form.confirmPassword),
    }),
    [form]
  );

  const canSubmit = isFormValid(errors);

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
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            navigate("/project-managers");
          }}
        >
          <ProfileImageUpload
            isDarkMode={isDarkMode}
            preview={preview}
            onPreviewChange={setPreview}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Name</label>
              <input className={inputClass} placeholder="Enter Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} onBlur={() => setTouched(true)} />
              {touched && errors.name && <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{errors.name}</p>}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Email Address</label>
              <input className={inputClass} placeholder="Enter Email Address" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} onBlur={() => setTouched(true)} />
              {touched && errors.email && <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{errors.email}</p>}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="Enter New Password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  onBlur={() => setTouched(true)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched && errors.password && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{errors.password}</p>
              )}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="Confirm New Password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  onBlur={() => setTouched(true)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched && errors.confirmPassword && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{errors.confirmPassword}</p>
              )}
            </div>
            <FormStatusSelect
              value={form.status}
              onChange={(status) => setForm((prev) => ({ ...prev, status }))}
              inputClass={inputClass}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={!canSubmit} className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]">
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
