import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import ProfileImageUpload from "../../../components/admin/ProfileImageUpload";
import TableCard from "../../../components/admin/TableCard";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import {
  getConfirmPasswordError,
  getEmailError,
  getPasswordError,
  getRequiredError,
  isFormValid,
} from "../../shared/utils/validation";

const MANAGER_FORM_FIELDS = ["name", "email", "password", "confirmPassword"];

function AddSalesManagerPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

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

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: MANAGER_FORM_FIELDS,
  });

  const canSubmit = isFormValid(errors);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Add Sales Manager"
        breadcrumbs={[
          { label: "Sales", to: "/sales/sales-manager" },
          { label: "Sales Manager", to: "/sales/sales-manager" },
          { label: "Add Sales Manager" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Sales Manager Details" isDarkMode={isDarkMode}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!validateSubmit() || !canSubmit) return;
            navigate("/sales/sales-manager");
          }}
          noValidate
        >
          <ProfileImageUpload
            isDarkMode={isDarkMode}
            preview={preview}
            onPreviewChange={setPreview}
            name={form.name}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Name</label>
              <input
                className={inputClass}
                placeholder="Enter Name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => touch("name")}
              />
              {showError("name") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("name")}</p>
              )}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Email Address</label>
              <input
                className={inputClass}
                placeholder="Enter Email Address"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                onBlur={() => touch("email")}
              />
              {showError("email") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("email")}</p>
              )}
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
                  onBlur={() => touch("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {showError("password") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("password")}</p>
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
                  onBlur={() => touch("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {showError("confirmPassword") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">
                  {showError("confirmPassword")}
                </p>
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
              onClick={() => navigate("/sales/sales-manager")}
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

export default AddSalesManagerPage;
