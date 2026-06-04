import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FormField from "../../components/admin/FormField";
import FormStatusSelect from "../../components/admin/FormStatusSelect";
import ProfileImageUpload from "../../components/admin/ProfileImageUpload";
import TableCard from "../../components/admin/TableCard";
import UserPermissionsTable from "../../components/admin/UserPermissionsTable";
import { toastApiError } from "../../services/toast/apiToast";
import {
  createDefaultPermissions,
  normalizePermissions,
} from "../../modules/permissions/permissionsUtils";
import {
  createUser,
  formStatusToApiStatus,
  getRecord,
  mapAdminToForm,
  updateRecord,
} from "../../services/users/usersApi";
import {
  fieldDisabled,
  useFormAccess,
} from "../../modules/permissions/FormAccessContext";
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
  permission_type: "user",
  permissions: createDefaultPermissions(),
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
  const [loadFailed, setLoadFailed] = useState(false);

  const { readOnly, showSubmit } = useFormAccess();
  const inputClass = getAdminInputClass();

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadUser = async () => {
      setIsLoadingRecord(true);
      setLoadFailed(false);
      try {
        const admin = await getRecord(id);
        if (cancelled) return;
        setForm(mapAdminToForm(admin));
        setExistingImage(admin?.image_url || "");
      } catch (error) {
        if (cancelled) return;
        setLoadFailed(true);
        toastApiError(error);
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
    showSubmit &&
    !readOnly &&
    isFormValid(errors) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed;

  const onSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (readOnly || !showSubmit || !isFormValid(errors)) return;

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const data = await updateRecord(id, {
          name: form.name,
          permission_type: form.permission_type,
          status: formStatusToApiStatus(form.status),
          permissions: form.permissions,
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
        permissions: form.permissions,
      });

      navigate("/users", {
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

  if (isEdit && isLoadingRecord) {
    return (
      <div className="flex items-center justify-center gap-2 py-24">
        <Loader2 size={24} className="animate-spin text-[var(--admin-success-text)]" />
        <span className="admin-text-muted text-sm">Loading user...</span>
      </div>
    );
  }

  if (isEdit && loadFailed) {
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

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <TableCard title="Basic Information" isDarkMode={isDarkMode}>
          <div className="space-y-4">
            <ProfileImageUpload
              isDarkMode={isDarkMode}
              preview={preview}
              onPreviewChange={setPreview}
              existingImage={existingImage}
              showCurrentLabel={isEdit}
              name={form.name}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Name" required error={touched ? errors.name : ""}>
                <input
                  placeholder="Enter Name"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => setTouched(true)}
                  disabled={fieldDisabled(readOnly, isSubmitting)}
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
                  disabled={fieldDisabled(readOnly, isSubmitting) || isEdit}
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
                        disabled={fieldDisabled(readOnly, isSubmitting)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                        disabled={fieldDisabled(readOnly, isSubmitting)}
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
                        disabled={fieldDisabled(readOnly, isSubmitting)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                        disabled={fieldDisabled(readOnly, isSubmitting)}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormField>
                </>
              )}
              <FormStatusSelect
                value={form.status}
                onChange={(status) => setForm((prev) => ({ ...prev, status }))}
                inputClass={inputClass}
              />
            </div>
          </div>
        </TableCard>

        <TableCard title="User Permissions" isDarkMode={isDarkMode}>
          <UserPermissionsTable
            permissions={form.permissions}
            onChange={(permissions) => setForm((prev) => ({ ...prev, permissions }))}
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />
        </TableCard>

        <div className="flex flex-wrap items-center gap-3">
          {showSubmit && (
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
          )}
          <button
            type="button"
            onClick={() => navigate("/users")}
            disabled={fieldDisabled(readOnly, isSubmitting)}
            className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserFormPage;
