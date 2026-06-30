import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import {
  getAdminCancelButtonClass,
  getAdminInputClass,
  getAdminTextareaClass,
} from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getRequiredError,
  isFormValid,
} from "../../shared/utils/validation";
import { toastApiError } from "../../../services/toast/apiToast";
import {
  createScreeningQuestion,
  decodeQuestionId,
  getQuestionnaireByQuestionId,
  mapQuestionnaireToForm,
  updateScreeningQuestion,
} from "../../../services/screening/screeningQuestionsApi";
import {
  createEmptyQuestionItem,
  LANGUAGES,
  needsQuestionOptions,
  normalizeQuestionTypeLabel,
  optionsArrayToTextarea,
  optionsTextareaHasContent,
  parseOptionsTextarea,
  QUESTION_TYPES,
} from "../data/profilingQuestionsStore";

const FORM_FIELDS = [
  "language",
  "questionTitle",
  "questionText",
  "questionType",
  "optionsText",
];

function buildEmptyForm() {
  return {
    language: "",
    questionTitle: "",
    questionText: "",
    questionType: "",
    optionsText: "",
    required: false,
    status: "Active",
    recordId: null,
  };
}

function snapshotFromQuestionnaire(records) {
  const mapped = mapQuestionnaireToForm(records);
  const question = mapped.questions[0] ?? createEmptyQuestionItem();

  return {
    language: mapped.language ?? "",
    questionTitle: mapped.questionTitle ?? "",
    questionText: question.questionText ?? "",
    questionType: normalizeQuestionTypeLabel(question.questionType),
    optionsText: optionsArrayToTextarea(question.options, question.questionType),
    required: Boolean(question.required),
    status: mapped.status ?? "Active",
    recordId: question.recordId ?? null,
  };
}

function QuestionTypeSection({
  questionType,
  required,
  optionsText,
  inputClass,
  textareaClass,
  onQuestionTypeChange,
  onRequiredChange,
  onOptionsTextChange,
  showTypeError,
  showOptionsError,
  onTouchType,
  onTouchOptions,
}) {
  const normalizedType = normalizeQuestionTypeLabel(questionType);
  const showOptions = needsQuestionOptions(normalizedType);

  return (
    <div className="space-y-5">
      <div className="admin-type-required-row">
        <FormField
          label="Question Type"
          required
          error={showTypeError}
          className="admin-type-required-row__type min-w-0"
        >
          <SearchableSelect
            inputClass={inputClass}
            value={normalizedType}
            onChange={(type) => {
              onQuestionTypeChange(type);
              onTouchType?.();
            }}
            onBlur={onTouchType}
            options={QUESTION_TYPES}
            placeholder="Select Question Type"
            searchPlaceholder="Search question type..."
            searchable={false}
            aria-label="Select question type"
          />
        </FormField>

        <label className="admin-type-required-row__required admin-text flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={required}
            onChange={(event) => onRequiredChange(event.target.checked)}
            className="h-4 w-4 shrink-0 rounded accent-[var(--admin-primary-color)]"
          />
          <span className="font-semibold">Required</span>
        </label>
      </div>

      {showOptions && (
        <FormField label="Options" required error={showOptionsError}>
          <textarea
            className={`${textareaClass} w-full min-h-[8rem]`}
            placeholder={"Option A\nOption B\nOption C"}
            value={optionsText}
            onChange={(event) => onOptionsTextChange(event.target.value)}
            onBlur={onTouchOptions}
            aria-label="Options"
          />
        </FormField>
      )}
    </div>
  );
}

function ProfilingQuestionFormPage({ isDarkMode, mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(buildEmptyForm);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const inputClass = getAdminInputClass();
  const textareaClass = getAdminTextareaClass("min-h-[180px]");

  useEffect(() => {
    const normalizedId = decodeQuestionId(id);
    if (!isEdit || !normalizedId) {
      setForm(buildEmptyForm());
      setInitialSnapshot(null);
      setIsLoadingRecord(false);
      setLoadFailed(false);
      setTouched({});
      return undefined;
    }

    let cancelled = false;

    const loadQuestionnaire = async () => {
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const records = await getQuestionnaireByQuestionId(normalizedId);
        if (cancelled) return;

        const snapshot = snapshotFromQuestionnaire(records);
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

    loadQuestionnaire();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id]);

  const errors = useMemo(() => {
    const questionType = normalizeQuestionTypeLabel(form.questionType);
    const showOptions = needsQuestionOptions(questionType);

    return {
      language: getRequiredError(form.language, "Language"),
      questionTitle: getRequiredError(form.questionTitle, "Survey Title"),
      questionText: getRequiredError(form.questionText, "Question Text"),
      questionType: getRequiredError(form.questionType, "Question Type"),
      optionsText:
        showOptions && !optionsTextareaHasContent(form.optionsText)
          ? "Add at least one option"
          : "",
    };
  }, [form]);

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: FORM_FIELDS,
  });

  const touchField = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    touch(field);
  };

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return JSON.stringify(form) !== JSON.stringify(initialSnapshot);
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    isFormValid(errors) &&
    (!isEdit || isDirty) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed;

  const handleQuestionTypeChange = (questionType) => {
    const normalizedType = normalizeQuestionTypeLabel(questionType);
    setForm((prev) => ({
      ...prev,
      questionType: normalizedType,
      optionsText: needsQuestionOptions(normalizedType) ? prev.optionsText : "",
    }));
  };

  const buildPayload = () => {
    const questionType = normalizeQuestionTypeLabel(form.questionType);
    return {
      language: form.language.trim(),
      questionTitle: form.questionTitle.trim(),
      questionText: form.questionText.trim(),
      questionType,
      options: parseOptionsTextarea(form.optionsText, questionType),
      required: form.required,
      status: form.status,
      sortOrder: 0,
    };
  };

  const handleClearForm = () => {
    setForm(buildEmptyForm());
    setInitialSnapshot(null);
    setTouched({});
    resetValidation();
  };

  const handleSubmit = async () => {
    if (!validateSubmit() || !canSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      let lastData;

      if (isEdit && form.recordId) {
        lastData = await updateScreeningQuestion(form.recordId, payload);
      } else {
        lastData = await createScreeningQuestion(payload);
      }

      const successMessage =
        lastData?.message || (isEdit ? "Question updated." : "Question created.");

      navigate("/user-screening/questions", {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: successMessage,
          },
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
        <AdminPageHeader title="Edit Panel Questionnaire" isDarkMode={isDarkMode} />
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

  const pageTitle = isEdit ? "Edit Panel Questionnaire" : "Add Panel Questionnaire";

  return (
    <div className="admin-page-root min-w-0 space-y-6">
      <AdminPageHeader
        title={pageTitle}
        breadcrumbs={[
          { label: "Questionnaire Management", to: "/user-screening/questions" },
          { label: "Panel Questionnaire", to: "/user-screening/questions" },
          { label: pageTitle },
        ]}
        isDarkMode={isDarkMode}
      />

      <TableCard title="Profiling Question Details" isDarkMode={isDarkMode}>
        <form className="admin-form-root min-w-0 space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
          <FormField label="Language" required error={showError("language")}>
            <SearchableSelect
              inputClass={inputClass}
              value={form.language}
              onChange={(language) => setForm((prev) => ({ ...prev, language }))}
              onBlur={() => touchField("language")}
              options={LANGUAGES}
              placeholder="Select Language"
              searchPlaceholder="Search language..."
              aria-label="Select language"
            />
          </FormField>

          <FormField label="Survey Title" required error={showError("questionTitle")}>
            <input
              className={`${inputClass} w-full`}
              placeholder="Enter Survey Title"
              value={form.questionTitle}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, questionTitle: event.target.value }))
              }
              onBlur={() => touchField("questionTitle")}
            />
          </FormField>

          <FormField label="Question Text" required error={showError("questionText")}>
            <textarea
              className={`${textareaClass} w-full min-h-[8rem]`}
              placeholder="Enter question text"
              value={form.questionText}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, questionText: event.target.value }))
              }
              onBlur={() => touchField("questionText")}
            />
          </FormField>

          <QuestionTypeSection
            questionType={form.questionType}
            required={form.required}
            optionsText={form.optionsText}
            inputClass={inputClass}
            textareaClass={textareaClass}
            onQuestionTypeChange={handleQuestionTypeChange}
            onRequiredChange={(required) => setForm((prev) => ({ ...prev, required }))}
            onOptionsTextChange={(optionsText) => setForm((prev) => ({ ...prev, optionsText }))}
            showTypeError={touched.questionType ? errors.questionType : ""}
            showOptionsError={touched.optionsText ? errors.optionsText : ""}
            onTouchType={() => touchField("questionType")}
            onTouchOptions={() => touchField("optionsText")}
          />

          <div className="admin-form-actions flex flex-wrap items-center gap-3 pt-5">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? "Update" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/user-screening/questions")}
              className={getAdminCancelButtonClass()}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              disabled={isSubmitting}
              className={getAdminCancelButtonClass()}
            >
              Clear Form
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default ProfilingQuestionFormPage;
