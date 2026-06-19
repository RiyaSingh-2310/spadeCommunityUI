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
import { toastApiSuccess } from "../../../services/toast/apiToast";
import { createRecord } from "../services/userEmailTemplatesApi";

const FORM_FIELDS = ["emailTitle", "description"];

function AddUserEmailTemplatePage({ isDarkMode }) {
  const navigate = useNavigate();
  const { readOnly, showSubmit } = useFormAccess();

  const [emailTitle, setEmailTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      emailTitle: getRequiredError(emailTitle, "Email Title"),
      description: getRequiredError(description, "Email Description"),
    }),
    [emailTitle, description]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: FORM_FIELDS,
  });

  const canSubmit =
    showSubmit && !readOnly && isFormValid(errors) && !isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors)) return;

    setIsSubmitting(true);
    try {
      const data = await createRecord({
        emailTitle: emailTitle.trim(),
        description: description.trim(),
      });
      toastApiSuccess(data);
      navigate("/user-email-templates", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add User Email Template"
        breadcrumbs={[
          { label: "Users", to: "/community-users" },
          { label: "User List", to: "/community-users" },
          { label: "Add User Email Template" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Email Template Details" isDarkMode={isDarkMode}>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <FormField label="Email Title" required error={showError("emailTitle")}>
            <input
              className={inputClass}
              value={emailTitle}
              onChange={(event) => setEmailTitle(event.target.value)}
              onBlur={() => touch("emailTitle")}
              placeholder="Enter Email Title"
              disabled={fieldDisabled(readOnly, isSubmitting)}
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
              onChange={(event) => setDescription(event.target.value)}
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
