import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import ProfileImageUpload from "../../../components/admin/ProfileImageUpload";
import TableCard from "../../../components/admin/TableCard";
import PasswordField from "../../settings/components/PasswordField";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { resolveProfileImageUrl } from "../../shared/utils/userAvatar";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getOptionalConfirmPasswordError,
  getOptionalPasswordError,
  getRequiredError,
  isFormValid,
} from "../../shared/utils/validation";
import { toastApiSuccess } from "../../../services/toast/apiToast";
import { getCommunityUserById } from "../data/communityUsersStore";
import { updateRecord } from "../services/communityUsersApi";

const FORM_FIELDS = ["name", "password", "confirmPassword"];

function splitFullName(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function EditCommunityUserPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? getCommunityUserById(id) : null;
  const { readOnly, showSubmit } = useFormAccess();

  const initialName = existing?.name ?? "";
  const initialMobile = existing?.mobileNumber ?? "";
  const initialImage = resolveProfileImageUrl(existing) ?? "";

  const [name, setName] = useState(initialName);
  const [emailAddress] = useState(existing?.emailAddress ?? "");
  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preview, setPreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [existingImage] = useState(initialImage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { firstName, lastName } = splitFullName(name);
  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      name: getRequiredError(name, "Name"),
      password: getOptionalPasswordError(password),
      confirmPassword: getOptionalConfirmPasswordError(password, confirmPassword),
    }),
    [name, password, confirmPassword]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: FORM_FIELDS,
  });

  const isDirty = useMemo(() => {
    if (!existing) return false;
    if (imageFile) return true;
    if (preview && preview !== existingImage) return true;
    if (name.trim() !== initialName.trim()) return true;
    if (mobileNumber.trim() !== initialMobile.trim()) return true;
    if (password.trim()) return true;
    if (confirmPassword.trim()) return true;
    return false;
  }, [
    existing,
    imageFile,
    preview,
    existingImage,
    name,
    initialName,
    mobileNumber,
    initialMobile,
    password,
    confirmPassword,
  ]);

  const canSubmit =
    showSubmit && !readOnly && isFormValid(errors) && !isSubmitting && isDirty && Boolean(existing);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors) || !existing || !isDirty) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
      };

      if (imageFile) {
        payload.profileImage = await readFileAsDataUrl(imageFile);
      }

      if (password.trim()) {
        payload.password = password.trim();
      }

      await updateRecord(existing.id, payload);
      toastApiSuccess({ message: "User updated successfully." });
      navigate("/community-users", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!existing) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Edit User Details" isDarkMode={isDarkMode} />
        <p className="admin-text-muted text-sm">User not found.</p>
        <button
          type="button"
          onClick={() => navigate("/community-users")}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit User Details"
        breadcrumbs={[
          { label: "Panelist", to: "/community-users" },
          { label: "Panel List", to: "/community-users" },
          { label: "Edit User Details" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="User Details" isDarkMode={isDarkMode}>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <ProfileImageUpload
            isDarkMode={isDarkMode}
            preview={preview}
            onPreviewChange={setPreview}
            onFileChange={setImageFile}
            existingImage={existingImage}
            showCurrentLabel
            name={name}
            firstName={firstName}
            lastName={lastName}
          />

          <FormField label="Name" required error={showError("name")}>
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => touch("name")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="Email Address">
            <input
              type="email"
              className={`${inputClass} opacity-70`}
              value={emailAddress}
              disabled
              readOnly
            />
          </FormField>

          <FormField label="Mobile Number">
            <input
              className={inputClass}
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value)}
              placeholder="Enter Mobile Number"
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <PasswordField
            label="New Password"
            value={password}
            onChange={setPassword}
            onBlur={() => touch("password")}
            error={showError("password")}
            placeholder="Enter New Password"
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />

          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            onBlur={() => touch("confirmPassword")}
            error={showError("confirmPassword")}
            placeholder="Enter Confirm New Password"
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />

          <div className="admin-form-actions flex flex-wrap items-center gap-3 pt-2">
            {showSubmit && !readOnly && (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/community-users")}
              disabled={isSubmitting}
              className={getAdminCancelButtonClass()}
            >
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default EditCommunityUserPage;
