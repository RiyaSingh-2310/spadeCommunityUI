import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import CountrySelect from "../../../components/admin/CountrySelect";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  createSalesProject,
  getRecord,
  mapSalesProjectToForm,
  updateSalesProject,
} from "../../../services/sales/salesProjectsApi";
import { useAdminFormAccess } from "../../permissions/FormAccessContext";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getEmailError,
  getRequiredError,
  isFormValidForFields,
} from "../../shared/utils/validation";

const RFQ_REQUIRED_FIELDS = ["clientName", "email", "country", "subject", "status"];

const RFQ_FORM_FIELDS = [
  "clientName",
  "email",
  "country",
  "subject",
  "status",
  "comment",
];

const EMPTY_FORM = {
  clientName: "",
  email: "",
  country: "",
  subject: "",
  status: "",
  comment: "",
};

const STATUS_OPTIONS = [
  { value: "WIP", label: "Work In Progress (WIP)" },
  { value: "Won", label: "Won" },
  { value: "Lost", label: "Lost" },
];

function AddRfqPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { readOnly, showSubmit, controlDisabled, canSubmitForm } = useAdminFormAccess(isSubmitting);

  const errors = useMemo(
    () => ({
      clientName: getRequiredError(form.clientName, "Client Name"),
      email: getEmailError(form.email),
      country: getRequiredError(form.country, "Country"),
      subject: getRequiredError(form.subject, "Email Subject"),
      status: getRequiredError(form.status, "Status"),
      comment: "",
    }),
    [form]
  );

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: RFQ_FORM_FIELDS,
  });

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadProject = async () => {
      resetValidation();
      setForm(EMPTY_FORM);
      setInitialSnapshot(null);
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const project = await getRecord(id);
        if (cancelled) return;
        const mapped = mapSalesProjectToForm(project);
        setForm(mapped);
        setInitialSnapshot(mapped);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadProject();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, resetValidation]);

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;

    return RFQ_FORM_FIELDS.some((key) => form[key] !== initialSnapshot[key]);
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    canSubmitForm &&
    isFormValidForFields(errors, RFQ_REQUIRED_FIELDS) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed &&
    (!isEdit || isDirty);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      readOnly ||
      !showSubmit ||
      isSubmitting ||
      !validateSubmit() ||
      !isFormValidForFields(errors, RFQ_REQUIRED_FIELDS) ||
      (isEdit && !isDirty)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = isEdit
        ? await updateSalesProject(id, form)
        : await createSalesProject(form);
      toastApiSuccess(data);
      navigate("/sales/rfq", {
        replace: true,
        state: {
          flash: data.message ? { type: "success", message: data.message } : null,
          refresh: true,
        },
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${
    isDarkMode
      ? "border-[#344662] bg-[#101a2a] text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
      : "border-[#d8e3ef] bg-white text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]"
  }`;

  const renderField = (label, key, placeholder, type = "text", required = false) => (
    <div>
      <label className="admin-text mb-2 block text-sm font-semibold">
        {label}
        {required && <span className="text-[var(--admin-danger-text)]"> *</span>}
      </label>
      <input
        type={type}
        className={inputClass}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        onBlur={() => touch(key)}
        disabled={controlDisabled}
      />
      {showError(key) && (
        <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError(key)}</p>
      )}
    </div>
  );

  if (isEdit && isLoadingRecord) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-5">
        <AdminPageHeader
          title="Edit RFQ"
          breadcrumbs={[
            { label: "Sales", to: "/sales/rfq" },
            { label: "RFQ", to: "/sales/rfq" },
            { label: "Edit RFQ" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load RFQ details.
          <button
            type="button"
            onClick={() => navigate("/sales/rfq")}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Back to RFQ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={isEdit ? "Edit RFQ" : "Add RFQ"}
        breadcrumbs={[
          { label: "Sales", to: "/sales/rfq" },
          { label: "RFQ", to: "/sales/rfq" },
          { label: isEdit ? "Edit RFQ" : "Add RFQ" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="RFQ Details" isDarkMode={isDarkMode}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            {renderField("Client Name", "clientName", "Enter Name", "text", true)}
            {renderField("Email Address", "email", "Enter Email Address", "email", true)}
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Country
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <CountrySelect
                inputClass={inputClass}
                value={form.country}
                onChange={(country) => setForm((p) => ({ ...p, country }))}
                onBlur={() => touch("country")}
                disabled={controlDisabled}
              />
              {showError("country") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("country")}</p>
              )}
            </div>
            {renderField("Subject", "subject", "Enter Subject", "text", true)}
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Status
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <SearchableSelect
                inputClass={inputClass}
                value={form.status}
                onChange={(status) => setForm((p) => ({ ...p, status }))}
                onBlur={() => touch("status")}
                options={STATUS_OPTIONS}
                placeholder="Select Status"
                disabled={controlDisabled}
                searchable={false}
                aria-label="Select status"
              />
              {showError("status") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("status")}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">Comment</label>
              <RichTextEditor
                isDarkMode={isDarkMode}
                value={form.comment}
                onChange={(comment) => setForm((p) => ({ ...p, comment }))}
                onBlur={() => touch("comment")}
                placeholder="Enter Comment"
                disabled={controlDisabled}
              />
            </div>
          </div>
          {showSubmit && (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting
                  ? isEdit
                    ? "Updating..."
                    : "Submitting..."
                  : isEdit
                    ? "Update"
                    : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/sales/rfq")}
                disabled={controlDisabled}
                className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </TableCard>
    </div>
  );
}

export default AddRfqPage;
