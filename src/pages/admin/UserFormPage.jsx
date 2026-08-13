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
  permissionsEqual,
  resolvePermissionsFromRecord,
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
import { resolveProfileImageUrl } from "../../modules/shared/utils/userAvatar";
import { useFormValidation } from "../../modules/shared/hooks/useFormValidation";
import {
  EMAIL_FIELD_MAX_LENGTH,
  NAME_FIELD_MAX_LENGTH,
  PASSWORD_FIELD_MAX_LENGTH,
  getConfirmPasswordError,
  getEmailError,
  getOptionalConfirmPasswordError,
  getOptionalPasswordError,
  getPasswordError,
  getUserNameError,
  preventBlockedNameKeys,
  limitTextInput,
  isFormValid,
} from "../../modules/shared/utils/validation";

const USER_FORM_FIELDS = ["name", "email", "password", "confirmPassword"];

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
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  const { readOnly, showSubmit } = useFormAccess();
  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      name: getUserNameError(form.name),
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

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: USER_FORM_FIELDS,
  });

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadUser = async () => {
      resetValidation();
      setForm(EMPTY_ADD_FORM);
      setPreview("");
      setImageFile(null);
      setExistingImage("");
      setInitialSnapshot(null);
      setIsLoadingRecord(true);
      setLoadFailed(false);
      try {
        const admin = await getRecord(id);
        if (cancelled) return;
        const mapped = mapAdminToForm(admin);
        const normalizedPermissions = resolvePermissionsFromRecord(admin);
        setForm({
          ...mapped,
          permissions: normalizedPermissions,
        });
        setExistingImage(resolveProfileImageUrl(admin) ?? "");
        setInitialSnapshot({
          name: mapped.name.trim(),
          status: mapped.status,
          permission_type: mapped.permission_type,
          permissions: normalizedPermissions,
        });
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
  }, [isEdit, id, resetValidation]);

  const isClean = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;

    if (imageFile) return true;
    if (form.name.trim() !== initialSnapshot.name) return true;
    if (form.permission_type !== initialSnapshot.permission_type) return true;
    if (!permissionsEqual(form.permissions, initialSnapshot.permissions)) return true;
    if (form.password.trim()) return true;
    if (form.confirmPassword.trim()) return true;

    return false;
  }, [isEdit, initialSnapshot, form, imageFile]);

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isFormValid(errors) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed &&
    (!isEdit || isClean);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (readOnly || !showSubmit || !validateSubmit() || !isFormValid(errors)) return;

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const data = await updateRecord(id, {
          name: form.name,
          permission_type: form.permission_type,
          status: formStatusToApiStatus(form.status),
          permissions: form.permissions,
          password: form.password.trim(),
          confirmPassword: form.confirmPassword.trim(),
          imageFile,
        });

        navigate("/users", {
          replace: true,
          state: {
            flash: {
              type: "success",
              message: data?.message || "User updated successfully.",
            },
            refresh: true,
          },
        });
        return;
      }

      const data = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        contact_no: "",
        imageFile,
        permission_type: form.permission_type,
        status: formStatusToApiStatus(form.status),
        permissions: form.permissions,
      });

      navigate("/users", {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: data?.message || "User added successfully.",
          },
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
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Admin User"
          breadcrumbs={[
            { label: "Users", to: "/users" },
            { label: "Edit User" },
          ]}
          isDarkMode={isDarkMode}
        />
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
              onFileChange={setImageFile}
              existingImage={existingImage}
              showCurrentLabel={isEdit}
              name={form.name}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Name" required error={showError("name")}>
                <input
                  placeholder="Enter Name"
                  className={inputClass}
                  value={form.name}
                  maxLength={NAME_FIELD_MAX_LENGTH}
                  onChange={(e) =>
                    setForm({ ...form, name: limitTextInput(e.target.value, NAME_FIELD_MAX_LENGTH) })
                  }
                  onKeyDown={preventBlockedNameKeys}
                  onBlur={() => touch("name")}
                  disabled={fieldDisabled(readOnly, isSubmitting)}
                />
              </FormField>
              <FormField
                label="Email Address"
                required={!isEdit}
                error={showError("email")}
              >
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  className={`${inputClass} ${isEdit ? "opacity-70" : ""}`}
                  value={form.email}
                  maxLength={EMAIL_FIELD_MAX_LENGTH}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: limitTextInput(e.target.value, EMAIL_FIELD_MAX_LENGTH),
                    })
                  }
                  onBlur={() => touch("email")}
                  disabled={fieldDisabled(readOnly, isSubmitting) || isEdit}
                  readOnly={isEdit}
                />
              </FormField>
              <FormField
                label={isEdit ? "New Password" : "Password"}
                required={!isEdit}
                error={showError("password")}
              >
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={isEdit ? "Enter New Password" : "Enter Password"}
                    className={`${inputClass} pr-10`}
                    value={form.password}
                    maxLength={PASSWORD_FIELD_MAX_LENGTH}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password: limitTextInput(e.target.value, PASSWORD_FIELD_MAX_LENGTH),
                      })
                    }
                    onBlur={() => touch("password")}
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
                label={isEdit ? "Confirm New Password" : "Confirm Password"}
                required={!isEdit}
                error={showError("confirmPassword")}
              >
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={isEdit ? "Confirm New Password" : "Confirm Password"}
                    className={`${inputClass} pr-10`}
                    value={form.confirmPassword}
                    maxLength={PASSWORD_FIELD_MAX_LENGTH}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        confirmPassword: limitTextInput(
                          e.target.value,
                          PASSWORD_FIELD_MAX_LENGTH
                        ),
                      })
                    }
                    onBlur={() => touch("confirmPassword")}
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
              {!isEdit && (
                <FormStatusSelect
                  value={form.status}
                  onChange={(status) => setForm((prev) => ({ ...prev, status }))}
                  inputClass={inputClass}
                />
              )}
            </div>
          </div>
        </TableCard>

        <TableCard title="User Permissions" isDarkMode={isDarkMode}>
          <UserPermissionsTable
            permissions={form.permissions}
            permissionsInitKey={isEdit && initialSnapshot ? id : null}
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
