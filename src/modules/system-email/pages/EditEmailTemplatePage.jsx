import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import FormSuccessMessage from "../../../components/admin/FormSuccessMessage";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import TableCard from "../../../components/admin/TableCard";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { getRequiredError, isFormValid } from "../../shared/utils/validation";
import { getEmailTemplateById, saveEmailTemplate } from "../data/emailTemplatesStore";

function buildInitialForm(templateId) {
  const existing = getEmailTemplateById(templateId);
  if (!existing) {
    return { title: "", subject: "", body: "" };
  }
  return {
    title: existing.title,
    subject: existing.subject,
    body: existing.body,
  };
}

function EditEmailTemplatePage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? getEmailTemplateById(id) : null;
  const [form, setForm] = useState(() => buildInitialForm(id));
  const [touched, setTouched] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      title: getRequiredError(form.title, "Template Title"),
      subject: getRequiredError(form.subject, "Email Subject"),
      body: getRequiredError(form.body.replace(/<[^>]*>/g, "").trim() || form.body, "Email Body"),
    }),
    [form]
  );

  const canSubmit = isFormValid(errors);

  const setField = (key, value) => {
    setSuccessMessage("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit || !existing) return;
    saveEmailTemplate({
      id: existing.id,
      title: form.title.trim(),
      subject: form.subject.trim(),
      body: form.body,
    });
    setSuccessMessage("Email template saved successfully.");
  };

  if (!existing) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Edit Template" isDarkMode={isDarkMode} />
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
        title="Edit Template"
        breadcrumbs={[
          { label: "System Email Template", to: "/system-email" },
          { label: "Edit Template" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Email Template Details" isDarkMode={isDarkMode}>
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <FormSuccessMessage message={successMessage} />
          <FormField
            label="Template Title"
            required
            error={touched ? errors.title : ""}
          >
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              onBlur={() => setTouched(true)}
            />
          </FormField>
          <FormField
            label="Email Subject"
            required
            error={touched ? errors.subject : ""}
          >
            <input
              className={inputClass}
              placeholder="Enter Email Subject"
              value={form.subject}
              onChange={(e) => setField("subject", e.target.value)}
              onBlur={() => setTouched(true)}
            />
          </FormField>
          <FormField
            label="Email Body"
            required
            error={touched ? errors.body : ""}
          >
            <RichTextEditor
              isDarkMode={isDarkMode}
              value={form.body}
              onChange={(v) => setField("body", v)}
              placeholder="Enter Email Content"
            />
          </FormField>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => navigate("/system-email")}
              className={`h-11 rounded-xl px-5 text-sm font-semibold ${
                isDarkMode
                  ? "bg-[#1f3047] text-[var(--admin-foreground)]"
                  : "bg-[#eef4fb] text-[var(--admin-foreground)]"
              }`}
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
