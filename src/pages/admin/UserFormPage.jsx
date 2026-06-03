import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FormErrorMessage from "../../components/admin/FormErrorMessage";
import FormField from "../../components/admin/FormField";
import FormPermissionSelect from "../../components/admin/FormPermissionSelect";
import FormStatusSelect from "../../components/admin/FormStatusSelect";
import ProfileImageUpload from "../../components/admin/ProfileImageUpload";
import TableCard from "../../components/admin/TableCard";
import { ApiError } from "../../services/api/ApiError";
import {
  createUser,
  formStatusToApiStatus,
  getRecord,
  mapAdminToForm,
  updateRecord,
} from "../../services/users/usersApi";
import { getAdminInputClass } from "../../modules/shared/utils/formStyles";
import {
  getConfirmPasswordError,
  getEmailError,
  getOptionalConfirmPasswordError,
  getOptionalPasswordError,
  getPasswordError,
  getRequiredError,
  isFormValid,
} from "../../modules/shared/utils/validation";

const EMPTY_ADD_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  status: "Active",
  permission_type: "admin",
};

function UserFormPage({ isDarkMode, mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";

  const [form, setForm] = useState(EMPTY_ADD_FORM);
  const [preview, setPreview] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [apiError, setApiError] = useState("");

  const inputClass = getAdminInputClass();

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadUser = async () => {
      setIsLoadingRecord(true);
      setLoadError("");
      try {
        const admin = await getRecord(id);
        if (cancelled) return;
        setForm(mapAdminToForm(admin));
        setExistingImage(admin?.image_url || "");
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof ApiError ? error.message : error?.message || ""
        );
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id]);

  const errors = useMemo(
    () => ({
      name: getRequiredError(form.name, "Name"),
      email: isEdit ? "" : getEmailError(form.email),
      password: isEdit
        ? getOptionalPasswordError(form.password)
        : getPasswordError(form.password),
      confirmPassword: isEdit
        ? getOptionalConfirmPasswordError(form.password, form.confirmPassword)
        : getConfirmPasswordError(form.password, form.confirmPassword),
    }),
    [form, isEdit]
  );

  const canSubmit =
    isFormValid(errors) && !isSubmitting && !isLoadingRecord && !loadError;

  const onSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    setApiError("");

    if (!isFormValid(errors)) return;

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const data = await updateRecord(id, {
          name: form.name,
          permission_type: form.permission_type,
          status: formStatusToApiStatus(form.status),
        });

        navigate("/users", {
          replace: true,
          state: {
            flash: { type: "success", message: data.message },
            refresh: true,
          },
        });
        return;
      }

      const data = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        contact_no: "",
        permission_type: form.permission_type,
        status: formStatusToApiStatus(form.status),
      });

      navigate("/users", {
        replace: true,
        state: {
          flash: { type: "success", message: data.message },
          refresh: true,
        },
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error?.message || "Request failed";
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && isLoadingRecord) {
    return (
      <div className="flex items-center justify-center gap-2 py-24">
        <Loader2 size={24} className="animate-spin text-[var(--admin-success-text)]" />
        <span className="admin-text-muted text-sm">Loading user...</span>
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="space-y-4">
        <AdminPageHeader
          title="Edit Admin User"
          breadcrumbs={[
            { label: "Users", to: "/users" },
            { label: "Edit User" },
          ]}
          isDarkMode={isDarkMode}
        />
        <FormErrorMessage message={loadError} />
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="admin-text h-11 rounded-xl border border-[var(--admin-header-surface-border)] px-5 text-sm font-semibold"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={isEdit ? "Edit Admin User" : "Add Admin User"}
        breadcrumbs={[
          { label: "Users", to: "/users" },
          { label: isEdit ? "Edit User" : "Add User" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title={isEdit ? `Editing User #${id}` : "User Details"} isDarkMode={isDarkMode}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <ProfileImageUpload
            isDarkMode={isDarkMode}
            preview={preview}
            onPreviewChange={setPreview}
            existingImage={existingImage}
            showCurrentLabel={isEdit}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Name" required error={touched ? errors.name : ""}>
              <input
                placeholder="Enter Name"
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => setTouched(true)}
                disabled={isSubmitting}
              />
            </FormField>
            <FormField
              label="Email Address"
              required={!isEdit}
              error={touched ? errors.email : ""}
            >
              <input
                type="email"
                placeholder="Enter Email Address"
                className={`${inputClass} ${isEdit ? "opacity-70" : ""}`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => setTouched(true)}
                disabled={isSubmitting || isEdit}
                readOnly={isEdit}
              />
            </FormField>
            {!isEdit && (
              <>
                <FormField label="Password" required error={touched ? errors.password : ""}>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter Password"
                      className={`${inputClass} pr-10`}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onBlur={() => setTouched(true)}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormField>
                <FormField
                  label="Confirm Password"
                  required
                  error={touched ? errors.confirmPassword : ""}
                >
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      className={`${inputClass} pr-10`}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({ ...form, confirmPassword: e.target.value })
                      }
                      onBlur={() => setTouched(true)}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormField>
              </>
            )}
            <FormPermissionSelect
              value={form.permission_type}
              onChange={(permission_type) =>
                setForm((prev) => ({ ...prev, permission_type }))
              }
              inputClass={inputClass}
            />
            <FormStatusSelect
              value={form.status}
              onChange={(status) => setForm((prev) => ({ ...prev, status }))}
              inputClass={inputClass}
            />
          </div>

          <FormErrorMessage message={apiError} />

          <div className="flex items-center gap-3 pt-2">
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
              onClick={() => navigate("/users")}
              disabled={isSubmitting}
              className={`h-11 rounded-xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                isDarkMode
                  ? "bg-[#1f3047] text-[var(--admin-foreground)]"
                  : "bg-[#eef4fb] text-[var(--admin-foreground)]"
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default UserFormPage;
