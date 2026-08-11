import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import FormStatusSelect from "../../../components/admin/FormStatusSelect";
import TableCard from "../../../components/admin/TableCard";
import PasswordField from "../../settings/components/PasswordField";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  EMAIL_FIELD_MAX_LENGTH,
  NAME_FIELD_MAX_LENGTH,
  PASSWORD_FIELD_MAX_LENGTH,
  getEmailError,
  getOptionalConfirmPasswordError,
  getOptionalPasswordError,
  getUserNameError,
  preventBlockedNameKeys,
  isFormValid,
  limitTextInput,
} from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { getRecord, mapPanelistToForm, updateRecord } from "../services/communityUsersApi";

const FORM_FIELDS = ["name", "email", "password", "confirmPassword"];

const EMPTY_FORM = {
  name: "",
  email: "",
  status: "Active",
  password: "",
  confirmPassword: "",
};

function EditCommunityUserPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { readOnly, showSubmit } = useFormAccess();

  const [form, setForm] = useState(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = getAdminInputClass();

  useEffect(() => {
    if (!id) {
      setIsLoadingRecord(false);
      setLoadFailed(true);
      return undefined;
    }

    let cancelled = false;

    const loadPanelist = async () => {
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const record = await getRecord(id);
        if (cancelled) return;

        const mapped = mapPanelistToForm(record);
        const snapshot = {
          name: mapped.name.trim(),
          email: mapped.email.trim(),
          status: mapped.status,
        };

        setForm({
          ...EMPTY_FORM,
          ...mapped,
        });
        setInitialSnapshot(snapshot);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadPanelist();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const errors = useMemo(
    () => ({
      name: getUserNameError(form.name),
      email: getEmailError(form.email, { label: "Email Address" }),
      password: getOptionalPasswordError(form.password),
      confirmPassword: getOptionalConfirmPasswordError(form.password, form.confirmPassword),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: FORM_FIELDS,
  });

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return (
      form.name.trim() !== initialSnapshot.name ||
      form.email.trim() !== initialSnapshot.email ||
      form.status !== initialSnapshot.status
    );
  }, [form, initialSnapshot]);

  const canSubmit =
    showSubmit && !readOnly && isFormValid(errors) && !isSubmitting && isDirty && !loadFailed;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors) || !id || !isDirty) return;

    setIsSubmitting(true);
    try {
      const data = await updateRecord(id, {
        name: form.name.trim(),
        email: form.email.trim(),
        status: form.status,
      });
      toastApiSuccess(data);
      navigate("/community-users", { replace: true, state: { refresh: true } });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingRecord) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (loadFailed || !initialSnapshot) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit User Details"
          breadcrumbs={[
            { label: "Panelist", to: "/community-users" },
            { label: "Edit User Details" },
          ]}
          isDarkMode={isDarkMode}
        />
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
          { label: "Edit User Details" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="User Details" isDarkMode={isDarkMode}>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <FormField label="Name" required error={showError("name")}>
            <input
              className={inputClass}
              value={form.name}
              maxLength={NAME_FIELD_MAX_LENGTH}
              onChange={(event) =>
                setField("name", limitTextInput(event.target.value, NAME_FIELD_MAX_LENGTH))
              }
              onKeyDown={preventBlockedNameKeys}
              onBlur={() => touch("name")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="Email Address" required error={showError("email")}>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              maxLength={EMAIL_FIELD_MAX_LENGTH}
              onChange={(event) =>
                setField("email", limitTextInput(event.target.value, EMAIL_FIELD_MAX_LENGTH))
              }
              onBlur={() => touch("email")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormStatusSelect
            value={form.status}
            onChange={(status) => setField("status", status)}
            inputClass={inputClass}
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />

          <PasswordField
            label="New Password"
            value={form.password}
            onChange={(value) =>
              setField("password", limitTextInput(value, PASSWORD_FIELD_MAX_LENGTH))
            }
            onBlur={() => touch("password")}
            error={showError("password")}
            placeholder="Enter New Password"
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />

          <PasswordField
            label="Confirm New Password"
            value={form.confirmPassword}
            onChange={(value) =>
              setField("confirmPassword", limitTextInput(value, PASSWORD_FIELD_MAX_LENGTH))
            }
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
