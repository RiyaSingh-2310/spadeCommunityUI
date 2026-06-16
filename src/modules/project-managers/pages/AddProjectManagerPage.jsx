import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormStatusSelect from "../../../components/admin/FormStatusSelect";
import ProfileImageUpload from "../../../components/admin/ProfileImageUpload";
import TableCard from "../../../components/admin/TableCard";
import { useAdminFormAccess } from "../../permissions/FormAccessContext";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  createProjectManager,
  getRecord,
  mapProjectManagerToForm,
  updateProjectManager,
} from "../../../services/projectManagers/projectManagersApi";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { resolveMediaUrl } from "../../shared/utils/userAvatar";
import {
  getConfirmPasswordError,
  getOptionalConfirmPasswordError,
  getOptionalPasswordError,
  getEmailError,
  getPasswordError,
  getRequiredError,
  isFormValidForFields,
} from "../../shared/utils/validation";

/** Backend accepts passwords of at least 6 characters (e.g. 123456). */
const PROJECT_MANAGER_PASSWORD_MIN_LENGTH = 6;

const MANAGER_FORM_FIELDS = ["name", "email", "password", "confirmPassword"];

const MANAGER_ADD_REQUIRED_FIELDS = ["name", "email", "password", "confirmPassword"];

const MANAGER_EDIT_REQUIRED_FIELDS = ["name"];

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  status: "Active",
};

function AddProjectManagerPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [preview, setPreview] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { readOnly, showSubmit, controlDisabled, canSubmitForm, fieldDisabled } =
    useAdminFormAccess(isSubmitting);

  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      name: getRequiredError(form.name, "Name"),
      email: isEdit ? "" : getEmailError(form.email),
      password: isEdit
        ? getOptionalPasswordError(form.password, PROJECT_MANAGER_PASSWORD_MIN_LENGTH)
        : getPasswordError(form.password, PROJECT_MANAGER_PASSWORD_MIN_LENGTH),
      confirmPassword: isEdit
        ? getOptionalConfirmPasswordError(form.password, form.confirmPassword)
        : getConfirmPasswordError(form.password, form.confirmPassword),
    }),
    [form, isEdit]
  );

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: MANAGER_FORM_FIELDS,
  });

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadProjectManager = async () => {
      resetValidation();
      setForm(EMPTY_FORM);
      setPreview("");
      setProfileImage(null);
      setExistingImage("");
      setInitialSnapshot(null);
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const projectManager = await getRecord(id);
        if (cancelled) return;

        const mapped = mapProjectManagerToForm(projectManager);
        setForm(mapped);
        setExistingImage(
          resolveMediaUrl(
            projectManager?.profile_image ??
              projectManager?.image_url ??
              projectManager?.imageUrl ??
              ""
          ) ?? ""
        );
        setInitialSnapshot({
          name: mapped.name.trim(),
          status: mapped.status,
        });
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadProjectManager();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, resetValidation]);

  const isClean = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;

    if (profileImage) return true;
    if (form.name.trim() !== initialSnapshot.name) return true;
    if (form.password.trim()) return true;
    if (form.confirmPassword.trim()) return true;

    return false;
  }, [isEdit, initialSnapshot, form, profileImage]);

  const requiredFields = isEdit ? MANAGER_EDIT_REQUIRED_FIELDS : MANAGER_ADD_REQUIRED_FIELDS;

  const canSubmit =
    canSubmitForm &&
    isFormValidForFields(errors, requiredFields) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed &&
    (!isEdit || isClean);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (
      readOnly ||
      !showSubmit ||
      !validateSubmit() ||
      !isFormValidForFields(errors, requiredFields) ||
      (isEdit && !isClean)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = isEdit
        ? await updateProjectManager(id, {
            name: form.name,
            email: form.email,
            status: form.status,
            profileImage,
            password: form.password,
            confirmPassword: form.confirmPassword,
          })
        : await createProjectManager({
            name: form.name,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
            profileImage,
          });

      toastApiSuccess(data);

      navigate("/project-managers", {
        replace: true,
        state: {
          flash: data.message ? { type: "success", message: data.message } : null,
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
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-5">
        <AdminPageHeader
          title="Edit Project Manager"
          breadcrumbs={[
            { label: "Project Managers", to: "/project-managers" },
            { label: "Edit Project Manager" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load project manager details.
          <button
            type="button"
            onClick={() => navigate("/project-managers")}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Back to Project Managers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={isEdit ? "Edit Project Manager" : "Add Project Manager"}
        breadcrumbs={[
          { label: "Project Managers", to: "/project-managers" },
          { label: isEdit ? "Edit Project Manager" : "Add Project Manager" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Project Manager Details" isDarkMode={isDarkMode}>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <ProfileImageUpload
            isDarkMode={isDarkMode}
            preview={preview}
            onPreviewChange={setPreview}
            onFileChange={setProfileImage}
            existingImage={existingImage}
            showCurrentLabel={isEdit}
            name={form.name}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Name
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <input
                className={inputClass}
                placeholder="Enter Name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => touch("name")}
                disabled={fieldDisabled()}
              />
              {showError("name") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("name")}</p>
              )}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Email Address
                {!isEdit && <span className="text-[var(--admin-danger-text)]"> *</span>}
              </label>
              <input
                className={`${inputClass}${isEdit ? " cursor-not-allowed opacity-70" : ""}`}
                placeholder="Enter Email Address"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                onBlur={() => touch("email")}
                disabled={fieldDisabled(isEdit)}
                readOnly={isEdit}
              />
              {showError("email") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("email")}</p>
              )}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                New Password
                {!isEdit && <span className="text-[var(--admin-danger-text)]"> *</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="Enter New Password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  onBlur={() => touch("password")}
                  disabled={fieldDisabled()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                  disabled={fieldDisabled()}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {showError("password") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">
                  {showError("password")}
                </p>
              )}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Confirm New Password
                {!isEdit && <span className="text-[var(--admin-danger-text)]"> *</span>}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="Confirm New Password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  onBlur={() => touch("confirmPassword")}
                  disabled={fieldDisabled()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
                  disabled={fieldDisabled()}
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
            {!isEdit && (
              <FormStatusSelect
                value={form.status}
                onChange={(status) => setForm((prev) => ({ ...prev, status }))}
                inputClass={inputClass}
                disabled={controlDisabled}
              />
            )}
          </div>
          <div className="flex items-center gap-3 pt-2">
            {showSubmit && !readOnly && (
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
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
              onClick={() => navigate("/project-managers")}
              disabled={controlDisabled}
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

export default AddProjectManagerPage;
