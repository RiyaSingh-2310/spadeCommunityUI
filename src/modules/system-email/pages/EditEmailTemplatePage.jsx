import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import TableCard from "../../../components/admin/TableCard";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getRequiredError, isFormValid } from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { getRecord, updateRecord } from "../services/systemEmailsApi";

const EMAIL_TEMPLATE_FIELDS = ["description"];

function EditEmailTemplatePage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { readOnly, showSubmit } = useFormAccess();

  const [template, setTemplate] = useState(null);
  const [description, setDescription] = useState("");
  const [initialDescription, setInitialDescription] = useState("");
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

        const content = record.content ?? "";
        setTemplate(record);
        setDescription(content);
        setInitialDescription(content);
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
      description: getRequiredError(description, "Email Description"),
    }),
    [description]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: EMAIL_TEMPLATE_FIELDS,
  });

  const isDirty = useMemo(
    () => description.trim() !== initialDescription.trim(),
    [description, initialDescription]
  );

  const canSubmit =
    showSubmit && !readOnly && isFormValid(errors) && !isSubmitting && isDirty;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors) || !template || !isDirty || !id) return;

    setIsSubmitting(true);
    try {
      const data = await updateRecord(id, {
        name: template.name ?? template.title ?? "",
        systemEmail: template.systemEmail ?? "",
        content: description.trim(),
      });

      const updatedContent = data.template?.content ?? description.trim();
      setDescription(updatedContent);
      setInitialDescription(updatedContent);
      if (data.template) {
        setTemplate(data.template);
      }

      toastApiSuccess(data);
      navigate("/system-email", { replace: true });
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

  if (loadFailed || !template) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Email Template"
          breadcrumbs={[
            { label: "System Email Template", to: "/system-email" },
            { label: "Edit Email Template" },
          ]}
          isDarkMode={isDarkMode}
        />
        <p className="admin-text-muted text-sm">Template not found.</p>
        <button
          type="button"
          onClick={() => navigate("/system-email")}
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
        title="Edit Email Template"
        breadcrumbs={[
          { label: "System Email Template", to: "/system-email" },
          { label: "Edit Email Template" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Email Template Details" isDarkMode={isDarkMode}>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <FormField label="Email Title">
            <input
              className={`${inputClass} opacity-70`}
              value={template.title ?? template.name ?? ""}
              disabled
              readOnly
            />
          </FormField>
          <FormField
            label="Email Description"
            required
            error={showError("description")}
          >
            <textarea
              className={`${inputClass} min-h-[240px] resize-y py-3`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => touch("description")}
              placeholder="Enter email description"
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>
          <div className="admin-form-actions flex flex-wrap items-center gap-3 pt-2">
            {showSubmit && !readOnly && (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Updating..." : "Update"}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/system-email")}
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

export default EditEmailTemplatePage;
