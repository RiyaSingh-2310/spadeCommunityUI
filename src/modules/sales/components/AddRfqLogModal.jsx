import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import FormField from "../../../components/admin/FormField";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  createSalesLog,
  resolveSalesProjectLogId,
} from "../../../services/sales/salesProjectsApi";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { getRequiredError } from "../../shared/utils/validation";

const COMMENT_BY_OPTIONS = [
  { value: "Sales", label: "Sales" },
  { value: "Client", label: "Client" },
];

const LOG_FORM_FIELDS = ["subject", "comment"];

function getRichTextRequiredError(value, label) {
  const plain = String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) {
    return `${label} is required`;
  }
  return "";
}

const EMPTY_FORM = {
  subject: "",
  comment: "",
  commentBy: "Sales",
};

function AddRfqLogModal({ isOpen, onClose, row, isDarkMode, onSubmitted }) {
  const inputClass = getAdminInputClass();
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      return;
    }

    setForm({
      subject: row?.emailSubject ?? "",
      comment: "",
      commentBy: "Sales",
    });
  }, [isOpen, row]);

  const errors = useMemo(
    () => ({
      subject: getRequiredError(form.subject, "Email Subject"),
      comment: getRichTextRequiredError(form.comment, "Comment"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: LOG_FORM_FIELDS,
  });

  useEffect(() => {
    if (!isOpen) resetValidation();
  }, [isOpen, resetValidation]);

  const projectId = resolveSalesProjectLogId(row);

  if (!isOpen || !projectId) return null;

  const canSubmit =
    !isSubmitting &&
    !errors.subject &&
    !errors.comment &&
    String(form.subject ?? "").trim() &&
    String(form.comment ?? "").trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !canSubmit) return;

    setIsSubmitting(true);
    try {
      const data = await createSalesLog(projectId, form);
      toastApiSuccess(data);
      onSubmitted?.();
      onClose();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close add log modal"
        onClick={onClose}
        disabled={isSubmitting}
      />
      <div
        className="admin-header-surface relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-rfq-log-title"
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <h2 id="add-rfq-log-title" className="admin-text text-lg font-bold">
            Add Log
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="admin-icon-btn admin-text-subtle flex h-8 w-8 items-center justify-center rounded-lg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <FormField label="Email Subject" required error={showError("subject")}>
              <input
                className={inputClass}
                placeholder="Enter Email Subject"
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                onBlur={() => touch("subject")}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField label="Comment" required error={showError("comment")}>
              <RichTextEditor
                isDarkMode={isDarkMode}
                value={form.comment}
                onChange={(comment) => setForm((prev) => ({ ...prev, comment }))}
                onBlur={() => touch("comment")}
                placeholder="Enter Comment"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField label="Comment By">
              <SearchableSelect
                inputClass={inputClass}
                value={form.commentBy}
                onChange={(commentBy) => setForm((prev) => ({ ...prev, commentBy }))}
                options={COMMENT_BY_OPTIONS}
                placeholder="Select Comment By"
                disabled={isSubmitting}
                searchable={false}
                aria-label="Select comment by"
              />
            </FormField>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={getAdminCancelButtonClass("modal")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRfqLogModal;
