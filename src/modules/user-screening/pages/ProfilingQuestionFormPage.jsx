import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import NumericInput from "../../../components/admin/NumericInput";
import FormField from "../../../components/admin/FormField";
import FormStatusSelect from "../../../components/admin/FormStatusSelect";
import QuestionTypeRadioGroup from "../../../components/admin/QuestionTypeRadioGroup";
import TableCard from "../../../components/admin/TableCard";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import {
  getRequiredError,
  isFormValid,
} from "../../shared/utils/validation";
import {
  createProfilingQuestion,
  getProfilingQuestionById,
  LANGUAGES,
  OPTION_QUESTION_TYPES,
  QUESTION_TYPES,
  saveProfilingQuestion,
} from "../data/profilingQuestionsStore";

const EMPTY_FORM = {
  language: "",
  questionTitle: "",
  questionType: "",
  options: "",
  sortOrder: "0",
  status: "Active",
};

function buildInitialForm(isEdit, questionId) {
  if (!isEdit || !questionId) return EMPTY_FORM;
  const existing = getProfilingQuestionById(questionId);
  if (!existing) return EMPTY_FORM;
  return {
    language: existing.language,
    questionTitle: existing.questionTitle,
    questionType: existing.questionType,
    options: existing.options || "",
    sortOrder: String(existing.sortOrder ?? 0),
    status: existing.status,
  };
}

function ProfilingQuestionFormPage({ isDarkMode, mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(() => buildInitialForm(isEdit, id));
  const [touched, setTouched] = useState(false);

  const inputClass = getAdminInputClass();
  const needsOptions = OPTION_QUESTION_TYPES.includes(form.questionType);
  const existingRecord = isEdit && id ? getProfilingQuestionById(id) : null;

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

  const canSubmit = isFormValid(errors);

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "questionType" && !OPTION_QUESTION_TYPES.includes(value)) {
        next.options = "";
      }
      return next;
    });
  };

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    const payload = {
      language: form.language.trim(),
      questionTitle: form.questionTitle.trim(),
      questionType: form.questionType,
      options: needsOptions ? form.options.trim() : "",
      sortOrder: Number(form.sortOrder) || 0,
      status: form.status,
    };

    if (isEdit && id) {
      saveProfilingQuestion({ id, ...payload });
    } else {
      createProfilingQuestion(payload);
    }
    navigate("/user-screening/questions");
  };

  if (isEdit && id && !existingRecord) {
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
            <FormField label="Language" required error={touched ? errors.language : ""}>
              <select
                className={inputClass}
                value={form.language}
                onChange={(e) => setField("language", e.target.value)}
                onBlur={() => setTouched(true)}
              >
                <option value="">Select Language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
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
              error={touched ? errors.questionTitle : ""}
            >
              <input
                className={inputClass}
                placeholder="Enter Question Title"
                value={form.questionTitle}
                onChange={(e) => setField("questionTitle", e.target.value)}
                onBlur={() => setTouched(true)}
              />
            </FormField>
          </div>

          <QuestionTypeRadioGroup
            value={form.questionType}
            onChange={(type) => setField("questionType", type)}
            options={QUESTION_TYPES}
            isDarkMode={isDarkMode}
          />

          {needsOptions && (
            <FormField label="Add Options" required error={touched ? errors.options : ""}>
              <textarea
                className={`${inputClass} min-h-[120px] py-2`}
                placeholder="Enter options (one per line)"
                value={form.options}
                onChange={(e) => setField("options", e.target.value)}
                onBlur={() => setTouched(true)}
              />
            </FormField>
          )}
          {touched && errors.questionType && (
            <p className="text-xs text-[var(--admin-danger-text)]">{errors.questionType}</p>
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
              className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit
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
