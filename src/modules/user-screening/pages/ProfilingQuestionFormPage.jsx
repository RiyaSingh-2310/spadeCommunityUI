import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import NumericInput from "../../../components/admin/NumericInput";
import FormField from "../../../components/admin/FormField";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import FormStatusSelect from "../../../components/admin/FormStatusSelect";
import QuestionTypeRadioGroup from "../../../components/admin/QuestionTypeRadioGroup";
import TableCard from "../../../components/admin/TableCard";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getRequiredError,
  isFormValid,
} from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  createPrescreen,
  getRecord,
  mapPrescreenToForm,
  updatePrescreen,
} from "../../../services/prescreen/prescreenQuestionnairesApi";
import {
  LANGUAGES,
  OPTION_QUESTION_TYPES,
  QUESTION_TYPES,
} from "../data/profilingQuestionsStore";

const PROFILING_QUESTION_FIELDS = [
  "language",
  "questionTitle",
  "questionType",
  "options",
  "status",
];

const EMPTY_FORM = {
  language: "",
  questionTitle: "",
  questionType: "",
  options: "",
  sortOrder: "0",
  status: "Active",
};

function ProfilingQuestionFormPage({ isDarkMode, mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClass = getAdminInputClass();
  const needsOptions = OPTION_QUESTION_TYPES.includes(form.questionType);

  useEffect(() => {
    if (!isEdit || !id) {
      setForm(EMPTY_FORM);
      setInitialSnapshot(null);
      setIsLoadingRecord(false);
      setLoadFailed(false);
      return undefined;
    }

    let cancelled = false;

    const loadQuestion = async () => {
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const record = await getRecord(id);
        if (cancelled) return;

        const mapped = mapPrescreenToForm(record);
        const snapshot = {
          language: mapped.language,
          questionTitle: mapped.questionTitle,
          questionType: mapped.questionType,
          options: mapped.options,
          sortOrder: mapped.sortOrder,
          status: mapped.status,
        };

        setForm(snapshot);
        setInitialSnapshot(snapshot);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadQuestion();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id]);

  const errors = useMemo(() => {
    const next = {
      language: getRequiredError(form.language, "Language"),
      questionTitle: getRequiredError(form.questionTitle, "Question Title"),
      questionType: getRequiredError(form.questionType, "Question Type"),
      status: getRequiredError(form.status, "Status"),
      options: "",
    };
    if (needsOptions) {
      next.options = getRequiredError(form.options, "Add Options");
    }
    return next;
  }, [form, needsOptions]);

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: PROFILING_QUESTION_FIELDS,
  });

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;

    return (
      form.language !== initialSnapshot.language ||
      form.questionTitle !== initialSnapshot.questionTitle ||
      form.questionType !== initialSnapshot.questionType ||
      form.options !== initialSnapshot.options ||
      form.sortOrder !== initialSnapshot.sortOrder ||
      form.status !== initialSnapshot.status
    );
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    isFormValid(errors) &&
    (!isEdit || isDirty) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed;

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "questionType" && !OPTION_QUESTION_TYPES.includes(value)) {
        next.options = "";
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!validateSubmit() || !canSubmit || (isEdit && !isDirty)) return;

    const payload = {
      language: form.language.trim(),
      questionTitle: form.questionTitle.trim(),
      questionType: form.questionType,
      options: needsOptions ? form.options.trim() : "",
      sortOrder: Number(form.sortOrder) || 0,
      status: form.status,
      rightAnswer: null,
    };

    setIsSubmitting(true);
    try {
      const data = isEdit
        ? await updatePrescreen(id, payload)
        : await createPrescreen(payload);

      toastApiSuccess(data);
      navigate("/user-screening/questions", {
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

  if (isEdit && isLoadingRecord) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Edit Profiling Questions" isDarkMode={isDarkMode} />
        <p className="admin-text-muted text-sm">Question not found.</p>
        <button
          type="button"
          onClick={() => navigate("/user-screening/questions")}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white"
        >
          Back to List
        </button>
      </div>
    );
  }

  const pageTitle = isEdit ? "Edit Profiling Questions" : "Add Profiling Questions";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pageTitle}
        breadcrumbs={[
          { label: "User Screening Management", to: "/user-screening/questions" },
          { label: "List of All Questions", to: "/user-screening/questions" },
          { label: pageTitle },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Profiling Question Details" isDarkMode={isDarkMode}>
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Language" required error={showError("language")}>
              <SearchableSelect
                inputClass={inputClass}
                value={form.language}
                onChange={(language) => setField("language", language)}
                onBlur={() => touch("language")}
                options={LANGUAGES}
                placeholder="Select Language"
                searchPlaceholder="Search language..."
                aria-label="Select language"
              />
            </FormField>
            <FormField label="Sort Order">
              <NumericInput
                className={inputClass}
                value={form.sortOrder}
                onChange={(v) => setField("sortOrder", v === "" ? "0" : v)}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              label="Question Title"
              required
              error={showError("questionTitle")}
            >
              <input
                className={inputClass}
                placeholder="Enter Question Title"
                value={form.questionTitle}
                onChange={(e) => setField("questionTitle", e.target.value)}
                onBlur={() => touch("questionTitle")}
              />
            </FormField>
          </div>

          <QuestionTypeRadioGroup
            value={form.questionType}
            onChange={(type) => {
              setField("questionType", type);
              touch("questionType");
            }}
            options={QUESTION_TYPES}
            isDarkMode={isDarkMode}
          />

          {needsOptions && (
            <FormField label="Add Options" required error={showError("options")}>
              <textarea
                className={`${inputClass} min-h-[120px] py-2`}
                placeholder="Enter options (one per line)"
                value={form.options}
                onChange={(e) => setField("options", e.target.value)}
                onBlur={() => touch("options")}
              />
            </FormField>
          )}
          {showError("questionType") && (
            <p className="text-xs text-[var(--admin-danger-text)]">{showError("questionType")}</p>
          )}

          <div className="max-w-md">
            <FormStatusSelect
              value={form.status}
              onChange={(status) => setField("status", status)}
              inputClass={inputClass}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? "Update" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/user-screening/questions")}
              className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default ProfilingQuestionFormPage;
