import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import Avatar from "../../../components/shared/Avatar";
import FormField from "../../../components/admin/FormField";
import TableCard from "../../../components/admin/TableCard";
import { getAdminUser } from "../../../services/auth/authStorage";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  IMAGE_UPLOAD_ACCEPT,
  validateImageFile,
} from "../../shared/utils/imageUploadValidation";
import { getValidImageUrl, resolveProfileImageUrl, splitFullName } from "../../shared/utils/userAvatar";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getConfirmPasswordError,
  getPasswordError,
  getRequiredError,
  isFormValidForFields,
} from "../../shared/utils/validation";
import {
  changePassword,
  fetchProfile,
  updateProfile,
} from "../services/settingsApi";
import PasswordField from "./PasswordField";

const PROFILE_FIELDS = ["name"];
const PASSWORD_FIELDS = ["currentPassword", "newPassword", "confirmPassword"];

function ProfileSettingsTab({ isDarkMode }) {
  const sessionUser = getAdminUser();
  const userId = sessionUser?.id;

  const [form, setForm] = useState({
    name: sessionUser?.displayName ?? sessionUser?.name ?? "",
    email: sessionUser?.email ?? "",
    phone: "",
  });
  const [profileMeta, setProfileMeta] = useState({
    status: "Active",
    permission_type: sessionUser?.permission_type ?? "user",
    permissions: sessionUser?.permissions ?? {},
  });
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [preview, setPreview] = useState("");
  const [existingImage, setExistingImage] = useState(sessionUser?.imageUrl ?? "");
  const [imageFile, setImageFile] = useState(null);
  const [imageValidationError, setImageValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const avatarInputRef = useRef(null);
  const blobUrlRef = useRef("");

  const inputClass = getAdminInputClass();
  const { firstName, lastName } = splitFullName(form.name);
  const resolvedDisplayImage = preview
    ? getValidImageUrl(preview)
    : resolveProfileImageUrl(existingImage);
  const hasImage = Boolean(resolvedDisplayImage);
  const avatarBorderClass = isDarkMode ? "border-[#344662]" : "border-[#d8e3ef]";

  const revokeBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = "";
    }
  };

  useEffect(() => () => revokeBlobUrl(), []);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setLoadFailed(true);
      return undefined;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const { form: loadedForm, admin } = await fetchProfile(userId);
        if (cancelled) return;

        const snapshot = {
          name: loadedForm.name.trim(),
          imageUrl: loadedForm.imageUrl ?? "",
        };

        setForm({
          name: loadedForm.name,
          email: loadedForm.email,
          phone: loadedForm.phone,
        });
        setProfileMeta({
          status: loadedForm.status,
          permission_type: loadedForm.permission_type,
          permissions: loadedForm.permissions,
        });
        setExistingImage(loadedForm.imageUrl ?? "");
        setInitialSnapshot(snapshot);
        setPreview("");
        setImageFile(null);
        setImageValidationError("");
        void admin;
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const profileErrors = useMemo(
    () => ({
      name: getRequiredError(form.name, "Full Name"),
    }),
    [form.name]
  );

  const passwordErrors = useMemo(
    () => ({
      currentPassword: getRequiredError(
        passwordForm.currentPassword,
        "Current Password"
      ),
      newPassword: getPasswordError(passwordForm.newPassword),
      confirmPassword: getConfirmPasswordError(
        passwordForm.newPassword,
        passwordForm.confirmPassword
      ),
    }),
    [passwordForm]
  );

  const {
    showError: showProfileError,
    touch: touchProfile,
    validateSubmit: validateProfileSubmit,
  } = useFormValidation({
    errors: profileErrors,
    fields: PROFILE_FIELDS,
  });

  const {
    showError: showPasswordError,
    touch: touchPassword,
    validateSubmit: validatePasswordSubmit,
  } = useFormValidation({
    errors: passwordErrors,
    fields: PASSWORD_FIELDS,
  });

  const isProfileDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    if (form.name.trim() !== initialSnapshot.name) return true;
    if (imageFile) return true;
    if (preview && preview !== initialSnapshot.imageUrl) return true;
    return false;
  }, [form.name, imageFile, preview, initialSnapshot]);

  const canSaveProfile =
    isProfileDirty &&
    isFormValidForFields(profileErrors, PROFILE_FIELDS) &&
    !isSavingProfile &&
    !isLoading;

  const canUpdatePassword =
    isFormValidForFields(passwordErrors, PASSWORD_FIELDS) &&
    !isSavingPassword &&
    !isLoading;

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      setImageValidationError(error);
      return;
    }

    setImageValidationError("");
    revokeBlobUrl();
    const nextUrl = URL.createObjectURL(file);
    blobUrlRef.current = nextUrl;
    setPreview(nextUrl);
    setImageFile(file);
  };

  const handleRemoveAvatar = () => {
    revokeBlobUrl();
    setPreview("");
    setImageFile(null);
    setImageValidationError("");
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!validateProfileSubmit() || !canSaveProfile || !userId) return;

    setIsSavingProfile(true);
    try {
      const data = await updateProfile(userId, {
        name: form.name,
        status: profileMeta.status,
        permission_type: profileMeta.permission_type,
        permissions: profileMeta.permissions,
        imageFile,
      });
      toastApiSuccess(data);
      const refreshed = await fetchProfile(userId);
      const snapshot = {
        name: refreshed.form.name.trim(),
        imageUrl: refreshed.form.imageUrl ?? "",
      };
      setForm({
        name: refreshed.form.name,
        email: refreshed.form.email,
        phone: refreshed.form.phone,
      });
      setExistingImage(refreshed.form.imageUrl ?? "");
      setInitialSnapshot(snapshot);
      setPreview("");
      setImageFile(null);
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    if (!validatePasswordSubmit() || !canUpdatePassword || !userId) return;

    setIsSavingPassword(true);
    try {
      const data = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      toastApiSuccess(data);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--admin-primary-color)]" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="admin-text rounded-xl border border-[var(--admin-header-surface-border)] p-6 text-sm">
        Unable to load profile information.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TableCard title="Profile Information" isDarkMode={isDarkMode}>
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div
              className={`shrink-0 overflow-hidden rounded-full border ${avatarBorderClass}`}
            >
              <Avatar
                imageUrl={hasImage ? resolvedDisplayImage : null}
                firstName={firstName}
                lastName={lastName}
                name={form.name}
                size="profileLarge"
                alt={form.name || "Profile"}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="admin-text text-lg font-semibold">
                  {form.name || "Admin"}
                </p>
                <p className="admin-text-muted text-sm">{form.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-[var(--admin-primary-color)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                  <Upload size={16} />
                  Change Avatar
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept={IMAGE_UPLOAD_ACCEPT}
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </label>
                {preview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className={`inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      isDarkMode
                        ? "border-[#344662] text-[var(--admin-foreground)] hover:bg-[#1f3047]"
                        : "border-[#d8e3ef] text-[var(--admin-foreground)] hover:bg-[#eef4fb]"
                    }`}
                  >
                    <X size={14} />
                    Remove
                  </button>
                )}
              </div>

              {imageValidationError && (
                <p className="text-xs text-[var(--admin-danger-text)]" role="alert">
                  {imageValidationError}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--admin-header-surface-border)]" />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              label="Full Name"
              required
              error={showProfileError("name")}
            >
              <input
                className={inputClass}
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                onBlur={() => touchProfile("name")}
                autoComplete="name"
              />
            </FormField>

            <FormField label="Email Address">
              <input
                className={inputClass}
                value={form.email}
                disabled
                readOnly
                autoComplete="email"
              />
            </FormField>

            <FormField label="Phone Number" className="md:col-span-2">
              <input
                className={inputClass}
                value={form.phone}
                disabled
                readOnly
                autoComplete="tel"
              />
            </FormField>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSaveProfile}
              className="h-11 rounded-xl bg-[var(--admin-primary-color)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </TableCard>

      <TableCard title="Update Your Password" isDarkMode={isDarkMode}>
        <p className="admin-text-muted mb-5 text-sm">
          Change your password to keep your account secure.
        </p>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div className="flex w-full flex-col gap-5">
            <PasswordField
              label="Current Password"
              value={passwordForm.currentPassword}
              onChange={(value) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: value }))
              }
              onBlur={() => touchPassword("currentPassword")}
              error={showPasswordError("currentPassword")}
              required
            />
            <PasswordField
              label="New Password"
              value={passwordForm.newPassword}
              onChange={(value) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: value }))
              }
              onBlur={() => touchPassword("newPassword")}
              error={showPasswordError("newPassword")}
              required
            />
            <PasswordField
              label="Confirm Password"
              value={passwordForm.confirmPassword}
              onChange={(value) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))
              }
              onBlur={() => touchPassword("confirmPassword")}
              error={showPasswordError("confirmPassword")}
              required
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={resetPasswordForm}
              className={getAdminCancelButtonClass()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canUpdatePassword}
              className="h-11 rounded-xl bg-[var(--admin-primary-color)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default ProfileSettingsTab;
