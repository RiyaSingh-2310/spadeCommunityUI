import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import TableCard from "../../../components/admin/TableCard";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getRequiredError, isFormValid } from "../../shared/utils/validation";

const EMAIL_TEMPLATE_FIELDS = ["description"];
import { toastApiSuccess } from "../../../services/toast/apiToast";
import {
  DEFAULT_EMAIL_DESCRIPTION,
  getEmailTemplateById,
  saveEmailTemplate,
} from "../data/emailTemplatesStore";

function buildInitialDescription(template) {
  const body = template?.body?.trim();
  return body || DEFAULT_EMAIL_DESCRIPTION;
}

function EditEmailTemplatePage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? getEmailTemplateById(id) : null;
  const { readOnly, showSubmit } = useFormAccess();

  const [description, setDescription] = useState(() =>
    buildInitialDescription(existing)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = getAdminInputClass();

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

  const canSubmit =
    showSubmit && !readOnly && isFormValid(errors) && !isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors) || !existing) return;

    setIsSubmitting(true);
    try {
      saveEmailTemplate({
        id: existing.id,
        title: existing.title,
        subject: existing.subject,
        body: description,
      });
      toastApiSuccess({ message: "Email template updated successfully." });
      navigate("/system-email", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!existing) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Edit Email Template" isDarkMode={isDarkMode} />
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
              value={existing.title}
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
                {isSubmitting ? "Submitting..." : "Submit"}
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
