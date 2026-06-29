import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import TableCard from "../../../components/admin/TableCard";
import EmailTemplateTagsHelper from "../components/EmailTemplateTagsHelper";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getRequiredError, isFormValid } from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { getRecord, updateRecord } from "../services/userEmailTemplatesApi";

const FORM_FIELDS = ["emailTitle", "description"];

function EditUserEmailTemplatePage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { readOnly, showSubmit } = useFormAccess();

  const [form, setForm] = useState({
    emailTitle: "",
    description: "",
  });
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = getAdminInputClass();

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setLoadFailed(true);
      return undefined;
    }

    let cancelled = false;

    const loadTemplate = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const record = await getRecord(id);
        if (cancelled) return;

        const snapshot = {
          emailTitle: record.emailTitle ?? "",
          description: record.content ?? "",
        };

        setForm(snapshot);
        setInitialSnapshot(snapshot);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadTemplate();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const errors = useMemo(
    () => ({
      emailTitle: getRequiredError(form.emailTitle, "Email Title"),
      description: getRequiredError(form.description, "Description"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: FORM_FIELDS,
  });

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;

    return FORM_FIELDS.some(
      (key) => String(form[key] ?? "").trim() !== String(initialSnapshot[key] ?? "").trim()
    );
  }, [form, initialSnapshot]);

  const canSubmit =
    showSubmit && !readOnly && isFormValid(errors) && !isSubmitting && isDirty;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors) || !isDirty || !id) return;

    setIsSubmitting(true);
    try {
      const data = await updateRecord(id, {
        emailTitle: form.emailTitle.trim(),
        description: form.description.trim(),
      });

      const updated = data.template ?? {
        emailTitle: form.emailTitle.trim(),
        content: form.description.trim(),
      };

      const snapshot = {
        emailTitle: updated.emailTitle ?? form.emailTitle.trim(),
        description: updated.content ?? form.description.trim(),
      };

      setForm(snapshot);
      setInitialSnapshot(snapshot);
      toastApiSuccess(data);
      navigate("/user-email-templates", { replace: true });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--admin-primary-color)]" />
      </div>
    );
  }

  if (loadFailed || !initialSnapshot) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Edit User Email Template" isDarkMode={isDarkMode} />
        <p className="admin-text-muted text-sm">Template not found.</p>
        <button
          type="button"
          onClick={() => navigate("/user-email-templates")}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit User Email Template"
        breadcrumbs={[
          { label: "System Email Template", to: "/system-email" },
          { label: "User Email Templates", to: "/user-email-templates" },
          { label: "Edit User Email Template" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Email Template Details" isDarkMode={isDarkMode}>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <FormField label="Email Title" error={showError("emailTitle")}>
            <input
              className={inputClass}
              value={form.emailTitle}
              onChange={(event) => setField("emailTitle", event.target.value)}
              onBlur={() => touch("emailTitle")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="Description" error={showError("description")}>
            <textarea
              className={`${inputClass} min-h-[240px] resize-y py-3`}
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              onBlur={() => touch("description")}
              placeholder="Enter an email template description"
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <EmailTemplateTagsHelper />

          <div className="admin-form-actions flex flex-wrap items-center gap-3 pt-2">
            {showSubmit && !readOnly && (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Updating..." : "Update"}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/user-email-templates")}
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

export default EditUserEmailTemplatePage;
