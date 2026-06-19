import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import TableCard from "../../../components/admin/TableCard";
import EmailTemplateTagsHelper from "../components/EmailTemplateTagsHelper";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { toastApiError } from "../../../services/toast/apiToast";
import { getRecord } from "../services/userEmailTemplatesApi";

function EditUserEmailTemplatePage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

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
        setTemplate(record);
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
          { label: "Users", to: "/community-users" },
          { label: "User Email Templates", to: "/user-email-templates" },
          { label: "Edit User Email Template" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Email Template Details" isDarkMode={isDarkMode}>
        <div className="space-y-5">
          <FormField label="Email Title">
            <input
              className={`${inputClass} opacity-70`}
              value={template.emailTitle}
              disabled
              readOnly
            />
          </FormField>

          <FormField label="Email Subject">
            <input
              className={`${inputClass} opacity-70`}
              value={template.subject}
              disabled
              readOnly
            />
          </FormField>

          <FormField label="Email Content">
            <textarea
              className={`${inputClass} min-h-[240px] resize-y py-3 opacity-70`}
              value={template.content}
              disabled
              readOnly
            />
          </FormField>

          <EmailTemplateTagsHelper />

          <div className="admin-form-actions flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/user-email-templates")}
              className={getAdminCancelButtonClass()}
            >
              Back to List
            </button>
          </div>
        </div>
      </TableCard>
    </div>
  );
}

export default EditUserEmailTemplatePage;
