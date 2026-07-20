import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import TableCard from "../../../components/admin/TableCard";
import EmailTemplateTagsHelper from "../components/EmailTemplateTagsHelper";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getRequiredError, isFormValid } from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { createRecord } from "../services/userEmailTemplatesApi";

const FORM_FIELDS = ["templateKey", "emailTitle", "subject", "body"];

function AddUserEmailTemplatePage({ isDarkMode }) {
  const navigate = useNavigate();
  const { readOnly, showSubmit } = useFormAccess();

  const [form, setForm] = useState({
    templateKey: "",
    emailTitle: "",
    subject: "",
    body: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      templateKey: getRequiredError(form.templateKey, "Slug"),
      emailTitle: getRequiredError(form.emailTitle, "Email Title"),
      subject: getRequiredError(form.subject, "Email Subject"),
      body: getRequiredError(form.body, "Email Body"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: FORM_FIELDS,
  });

  const canSubmit =
    showSubmit && !readOnly && isFormValid(errors) && !isSubmitting;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors)) return;

    setIsSubmitting(true);
    try {
      const data = await createRecord({
        templateKey: form.templateKey.trim(),
        emailTitle: form.emailTitle.trim(),
        subject: form.subject.trim(),
        body: form.body.trim(),
      });
      toastApiSuccess(data);
      navigate("/user-email-templates", { replace: true });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add User Email Template"
        breadcrumbs={[
          { label: "System Email Template", to: "/system-email" },
          { label: "User Email Templates", to: "/user-email-templates" },
          { label: "Add User Email Template" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Email Template Details" isDarkMode={isDarkMode}>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <FormField
            label="Slug"
            required
            error={showError("templateKey") ? errors.templateKey : ""}
          >
            <input
              className={inputClass}
              value={form.templateKey}
              onChange={(event) => setField("templateKey", event.target.value)}
              onBlur={() => touch("templateKey")}
              placeholder="Enter Slug"
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Email Title"
            required
            error={showError("emailTitle") ? errors.emailTitle : ""}
          >
            <input
              className={inputClass}
              value={form.emailTitle}
              onChange={(event) => setField("emailTitle", event.target.value)}
              onBlur={() => touch("emailTitle")}
              placeholder="Enter Email Title"
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Email Subject"
            required
            error={showError("subject") ? errors.subject : ""}
          >
            <input
              className={inputClass}
              value={form.subject}
              onChange={(event) => setField("subject", event.target.value)}
              onBlur={() => touch("subject")}
              placeholder="Enter Email Subject"
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Email Body"
            required
            error={showError("body") ? errors.body : ""}
          >
            <textarea
              className={`${inputClass} min-h-[240px] resize-y py-3`}
              value={form.body}
              onChange={(event) => setField("body", event.target.value)}
              onBlur={() => touch("body")}
              placeholder="Enter Email Body"
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
                {isSubmitting ? "Submitting..." : "Submit"}
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

export default AddUserEmailTemplatePage;
