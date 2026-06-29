import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
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
  updateScreeningQuestionStatus,
  updateScreeningSortOrder,
} from "../../../services/screening/screeningQuestionsApi";
import {
  createEmptyOption,
  createEmptyQuestionItem,
  isLabeledOptionQuestionType,
  isSimpleOptionQuestionType,
  LANGUAGES,
  needsQuestionOptions,
  normalizeOptionsForQuestionType,
  normalizeQuestionTypeLabel,
  QUESTION_TYPES,
} from "../data/profilingQuestionsStore";

const PROFILING_QUESTION_FIELDS = ["language", "questionTitle", "questions"];

const SECONDARY_ACTION_CLASS =
  "admin-text inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

const QUESTIONS_LIST_BORDER =
  "rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-input-bg)]";

function buildEmptyForm() {
  return {
    language: "",
    questionTitle: "",
    questions: [createEmptyQuestionItem()],
    status: "Active",
  };
}

function SimpleQuestionOptionsBuilder({
  options,
  onChange,
  inputClass,
  showError,
  onBlur,
  onAddOption,
  onRandomize,
}) {
  const updateOption = (index, value) => {
    onChange(options.map((option, optionIndex) => (optionIndex === index ? value : option)));
  };

  const handleKeyDown = (event, index) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onAddOption(index);
  };

  const removeOption = (index) => {
    if (options.length <= 1) return;
    onChange(options.filter((_, optionIndex) => optionIndex !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="admin-text-muted text-sm">
          Total Options: <span className="admin-text font-semibold">{options.length}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRandomize}
            disabled={options.length < 2}
            className={SECONDARY_ACTION_CLASS}
            style={{ borderColor: "var(--admin-input-border)" }}
          >
            Randomize
          </button>
          <button
            type="button"
            onClick={() => onAddOption(options.length - 1)}
            className={SECONDARY_ACTION_CLASS}
            style={{ borderColor: "var(--admin-input-border)" }}
          >
            <Plus size={16} />
            Add Option
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {options.map((option, index) => (
          <div key={`option-${index}`} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="admin-text text-sm font-semibold">Option {index + 1}</p>
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={options.length <= 1}
                className={getAdminCancelButtonClass("modal")}
              >
                Delete Option
              </button>
            </div>
            <FormField>
              <input
                id={`option-${index}`}
                className={`${inputClass} w-full`}
                placeholder="Enter option text"
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onBlur={onBlur}
                aria-label={`Option ${index + 1}`}
              />
            </FormField>
          </div>
        ))}
      </div>

      {showError && (
        <p className="text-xs text-[var(--admin-danger-text)]">{showError}</p>
      )}
    </div>
  );
}

function LabeledQuestionOptionsBuilder({
  options,
  onChange,
  inputClass,
  showError,
  onBlur,
  onAddOption,
  onRandomize,
}) {
  const updateOption = (index, key, value) => {
    onChange(
      options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [key]: value } : option
      )
    );
  };

  const handleKeyDown = (event, index) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onAddOption(index);
  };

  const removeOption = (index) => {
    if (options.length <= 1) return;
    onChange(options.filter((_, optionIndex) => optionIndex !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="admin-text-muted text-sm">
          Total Options: <span className="admin-text font-semibold">{options.length}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRandomize}
            disabled={options.length < 2}
            className={SECONDARY_ACTION_CLASS}
            style={{ borderColor: "var(--admin-input-border)" }}
          >
            Randomize
          </button>
          <button
            type="button"
            onClick={() => onAddOption(options.length - 1)}
            className={SECONDARY_ACTION_CLASS}
            style={{ borderColor: "var(--admin-input-border)" }}
          >
            <Plus size={16} />
            Add Option
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {options.map((option, index) => (
          <div key={`option-${index}`} className="space-y-3 pb-4 last:border-b-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="admin-text text-sm font-semibold">Option {index + 1}</p>
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={options.length <= 1}
                className={getAdminCancelButtonClass("modal")}
              >
                Delete Option
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField >
                <input
                  id={`option-label-${index}`}
                  className={inputClass}
                  placeholder="e.g. Male"
                  value={option.label}
                  onChange={(event) => updateOption(index, "label", event.target.value)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  onBlur={onBlur}
                  aria-label={`Option ${index + 1} label`}
                />
              </FormField>
              <FormField >
                <input
                  className={inputClass}
                  placeholder="e.g. male"
                  value={option.value}
                  onChange={(event) => updateOption(index, "value", event.target.value)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  onBlur={onBlur}
                  aria-label={`Option ${index + 1} value`}
                />
              </FormField>
            </div>
          </div>
        ))}
      </div>

      {showError && (
        <p className="text-xs text-[var(--admin-danger-text)]">{showError}</p>
      )}
    </div>
  );
}

function QuestionTypeSection({
  question,
  inputClass,
  onChange,
  showTypeError,
  showOptionsError,
  onTouchType,
  onTouchOptions,
}) {
  const questionType = normalizeQuestionTypeLabel(question.questionType);
  const showOptions = needsQuestionOptions(questionType);
  const useLabeledOptions = isLabeledOptionQuestionType(questionType);
  const useSimpleOptions = isSimpleOptionQuestionType(questionType);

  const setField = (key, value) => {
    const next = { ...question, [key]: value };
    if (key === "questionType") {
      const normalizedType = normalizeQuestionTypeLabel(value);
      next.questionType = normalizedType;
      next.options = normalizeOptionsForQuestionType([], normalizedType);
    }
    onChange(next);
  };

  const setOptions = (options) => {
    onChange({ ...question, options });
  };

  const handleAddOption = (afterIndex) => {
    const next = [...question.options];
    next.splice(afterIndex + 1, 0, createEmptyOption(questionType));
    setOptions(next);
    requestAnimationFrame(() => {
      const focusId = useLabeledOptions
        ? `option-label-${afterIndex + 1}`
        : `option-${afterIndex + 1}`;
      document.getElementById(focusId)?.focus();
    });
  };

  const handleRandomizeOptions = () => {
    setOptions(shuffleArray(question.options));
  };

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
            value={questionType}
            onChange={(type) => {
              setField("questionType", type);
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
            checked={question.required}
            onChange={(event) => setField("required", event.target.checked)}
            className="h-4 w-4 shrink-0 rounded accent-[var(--admin-primary-color)]"
          />
          <span className="font-semibold">Required</span>
        </label>
      </div>

      {showOptions && (
        <div className="space-y-3">
          <label className="admin-text block text-sm font-semibold">Options</label>
          {useLabeledOptions ? (
            <LabeledQuestionOptionsBuilder
              options={question.options}
              onChange={setOptions}
              inputClass={inputClass}
              showError={showOptionsError}
              onBlur={onTouchOptions}
              onAddOption={handleAddOption}
              onRandomize={handleRandomizeOptions}
            />
          ) : null}
          {useSimpleOptions ? (
            <SimpleQuestionOptionsBuilder
              options={question.options}
              onChange={setOptions}
              inputClass={inputClass}
              showError={showOptionsError}
              onBlur={onTouchOptions}
              onAddOption={handleAddOption}
              onRandomize={handleRandomizeOptions}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function shuffleArray(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function getQuestionListLabel(question, index) {
  const typeLabel = question.questionType || "—";
  const text = question.questionText?.trim() || "Untitled";
  return `${index + 1}. [${typeLabel}] ${text}`;
}

function optionHasContent(option, questionType) {
  if (isLabeledOptionQuestionType(questionType)) {
    return Boolean(option?.label?.trim() && option?.value?.trim());
  }
  return Boolean(String(option ?? "").trim());
}

function hasQuestionContent(question) {
  const questionType = normalizeQuestionTypeLabel(question.questionType);
  return Boolean(
    question.questionText.trim() ||
      questionType ||
      question.options.some((option) => optionHasContent(option, questionType))
  );
}

function ProfilingQuestionFormPage({ isDarkMode, mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(buildEmptyForm);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedQuestions, setTouchedQuestions] = useState({});
  const [deletedRecordIds, setDeletedRecordIds] = useState([]);
  const inputClass = getAdminInputClass();
  const textareaClass = getAdminTextareaClass("min-h-[180px]");

  const activeQuestion = form.questions[activeQuestionIndex] ?? form.questions[0];

  useEffect(() => {
    const normalizedId = decodeQuestionId(id);
    if (!isEdit || !normalizedId) {
      setForm(buildEmptyForm());
      setInitialSnapshot(null);
      setActiveQuestionIndex(0);
      setIsLoadingRecord(false);
      setLoadFailed(false);
      setTouchedQuestions({});
      setDeletedRecordIds([]);
      return undefined;
    }

    let cancelled = false;

    const loadQuestionnaire = async () => {
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const records = await getQuestionnaireByQuestionId(normalizedId);
        if (cancelled) return;

        const snapshot = mapQuestionnaireToForm(records);
        if (snapshot.questions.length === 0) {
          snapshot.questions = [createEmptyQuestionItem()];
        }

        setForm(snapshot);
        setInitialSnapshot(snapshot);
        setActiveQuestionIndex(0);
        setDeletedRecordIds([]);
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

  useEffect(() => {
    if (activeQuestionIndex >= form.questions.length) {
      setActiveQuestionIndex(Math.max(0, form.questions.length - 1));
    }
  }, [activeQuestionIndex, form.questions.length]);

  const questionErrors = useMemo(() => {
    return form.questions.map((question) => {
      const questionType = normalizeQuestionTypeLabel(question.questionType);
      const showOptions = needsQuestionOptions(questionType);
      const optionsValid =
        !showOptions ||
        question.options.some((option) => optionHasContent(option, questionType));

      return {
        questionText: getRequiredError(question.questionText, "Question Text"),
        questionType: getRequiredError(question.questionType, "Question Type"),
        options:
          showOptions && !optionsValid
            ? isLabeledOptionQuestionType(questionType)
              ? "Add at least one option with label and value"
              : "Add at least one option"
            : "",
      };
    });
  }, [form.questions]);

  const errors = useMemo(
    () => ({
      language: getRequiredError(form.language, "Language"),
      questionTitle: getRequiredError(form.questionTitle, "Question Title"),
      questions:
        questionErrors.some(
          (error) => error.questionText || error.questionType || error.options
        )
          ? "Complete all question fields"
          : "",
    }),
    [form, questionErrors]
  );

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: PROFILING_QUESTION_FIELDS,
  });

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return (
      deletedRecordIds.length > 0 ||
      JSON.stringify(form) !== JSON.stringify(initialSnapshot)
    );
  }, [isEdit, initialSnapshot, form, deletedRecordIds]);

  const canSubmit =
    isFormValid(errors) &&
    (!isEdit || isDirty) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed;

  const updateActiveQuestion = (nextQuestion) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, questionIndex) =>
        questionIndex === activeQuestionIndex ? nextQuestion : question
      ),
    }));
  };

  const addQuestion = () => {
    setForm((prev) => {
      const nextQuestions = [...prev.questions, createEmptyQuestionItem()];
      setActiveQuestionIndex(nextQuestions.length - 1);
      return { ...prev, questions: nextQuestions };
    });
  };

  const deleteQuestion = () => {
    setForm((prev) => {
      const removed = prev.questions[activeQuestionIndex];
      if (removed?.recordId) {
        setDeletedRecordIds((ids) =>
          ids.includes(removed.recordId) ? ids : [...ids, removed.recordId]
        );
      }

      let nextQuestions = prev.questions.filter(
        (_, questionIndex) => questionIndex !== activeQuestionIndex
      );
      if (nextQuestions.length === 0) {
        nextQuestions = [createEmptyQuestionItem()];
      }
      return { ...prev, questions: nextQuestions };
    });
    setActiveQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const moveQuestion = (direction) => {
    setForm((prev) => {
      const targetIndex = activeQuestionIndex + direction;
      if (targetIndex < 0 || targetIndex >= prev.questions.length) return prev;
      const nextQuestions = [...prev.questions];
      [nextQuestions[activeQuestionIndex], nextQuestions[targetIndex]] = [
        nextQuestions[targetIndex],
        nextQuestions[activeQuestionIndex],
      ];
      return { ...prev, questions: nextQuestions };
    });
    setActiveQuestionIndex((prev) => prev + direction);
  };

  const handleClearForm = () => {
    setForm(buildEmptyForm());
    setInitialSnapshot(null);
    setActiveQuestionIndex(0);
    setTouchedQuestions({});
    setDeletedRecordIds([]);
    resetValidation();
  };

  const buildQuestionPayload = (question, sortOrder) => ({
    language: form.language.trim(),
    questionTitle: form.questionTitle.trim(),
    questionText: question.questionText.trim() || form.questionTitle.trim(),
    questionType: question.questionType,
    options: question.options,
    required: question.required,
    status: form.status,
    sortOrder,
  });

  const touchQuestion = (index, field) => {
    setTouchedQuestions((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: true },
    }));
  };

  const handleSubmit = async () => {
    if (!validateSubmit() || !canSubmit || (isEdit && !isDirty)) return;

    setIsSubmitting(true);
    try {
      if (isEdit) {
        for (const recordId of deletedRecordIds) {
          await updateScreeningQuestionStatus(recordId, "Inactive");
        }

        const sortItems = [];
        let lastData = null;

        for (let index = 0; index < form.questions.length; index += 1) {
          const question = form.questions[index];
          const payload = buildQuestionPayload(question, index);

          if (question.recordId) {
            lastData = await updateScreeningQuestion(question.recordId, payload);
            sortItems.push({ id: question.recordId, sort_order: index });
          } else if (hasQuestionContent(question)) {
            lastData = await createScreeningQuestion(payload);
            const createdId = lastData?.data?.id;
            if (createdId != null) {
              sortItems.push({ id: createdId, sort_order: index });
            }
          }
        }

        if (sortItems.length > 1) {
          lastData = await updateScreeningSortOrder(sortItems);
        }

        const successMessage = lastData?.message || "Question updated.";
        navigate("/user-screening/questions", {
          replace: true,
          state: {
            flash: {
              type: "success",
              message: successMessage,
            },
          },
        });
        return;
      }

      let lastData = null;
      for (let index = 0; index < form.questions.length; index += 1) {
        const question = form.questions[index];
        lastData = await createScreeningQuestion(buildQuestionPayload(question, index));
      }
      const successMessage = lastData?.message || "Questions created.";
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
  const activeErrors = questionErrors[activeQuestionIndex] ?? {};
  const activeTouched = touchedQuestions[activeQuestionIndex] ?? {};

  return (
    <div className="admin-page-root min-w-0 space-y-6">
      <AdminPageHeader
        title={pageTitle}
        breadcrumbs={[
          { label: "Panelist", to: "/user-screening/questions" },
          { label: "Panel Questionnaire", to: "/user-screening/questions" },
          { label: pageTitle },
        ]}
        isDarkMode={isDarkMode}
      />

      <TableCard title="Profiling Question Details" isDarkMode={isDarkMode}>
        <form className="admin-form-root min-w-0 space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
          <div className="admin-form-grid-2">
            <FormField label="Language" required error={showError("language")}>
              <SearchableSelect
                inputClass={inputClass}
                value={form.language}
                onChange={(language) => setForm((prev) => ({ ...prev, language }))}
                onBlur={() => touch("language")}
                options={LANGUAGES}
                placeholder="Select Language"
                searchPlaceholder="Search language..."
                aria-label="Select language"
              />
            </FormField>
            <FormField
              label="Question Title"
              required
              error={showError("questionTitle")}
            >
              <input
                className={inputClass}
                placeholder="Enter Question Title"
                value={form.questionTitle}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, questionTitle: event.target.value }))
                }
                onBlur={() => touch("questionTitle")}
              />
            </FormField>
          </div>

          <div className="admin-form-grid-2">
            {activeQuestion ? (
              <FormField label="Question Text" required>
                <textarea
                  className={textareaClass}
                  placeholder="Enter question text"
                  value={activeQuestion.questionText}
                  onChange={(event) =>
                    updateActiveQuestion({
                      ...activeQuestion,
                      questionText: event.target.value,
                    })
                  }
                />
              </FormField>
            ) : (
              <p className="admin-text-muted text-sm">Select a question to edit.</p>
            )}

            <div className="space-y-5">
              <FormField label="Questions">
                <div className={`${QUESTIONS_LIST_BORDER} px-3 py-2`}>
                  {form.questions.length === 0 ? (
                    <p className="admin-text-muted py-2 text-sm">No questions added yet.</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {form.questions.map((question, index) => {
                        const isActive = index === activeQuestionIndex;
                        return (
                          <li key={question.id}>
                            <button
                              type="button"
                              onClick={() => setActiveQuestionIndex(index)}
                              className={`w-full rounded-lg px-2 py-2 text-left text-sm transition ${
                                isActive
                                  ? "admin-text font-semibold"
                                  : "admin-text-muted hover:admin-text"
                              }`}
                            >
                              {getQuestionListLabel(question, index)}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </FormField>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={isSubmitting}
                  className={SECONDARY_ACTION_CLASS}
                  style={{ borderColor: "var(--admin-input-border)" }}
                >
                  <Plus size={16} />
                  Add Question
                </button>
                <button
                  type="button"
                  onClick={deleteQuestion}
                  disabled={isSubmitting}
                  className={getAdminCancelButtonClass("modal")}
                >
                  Delete Question
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(-1)}
                  disabled={isSubmitting || activeQuestionIndex === 0}
                  className={getAdminCancelButtonClass("modal")}
                >
                  Move Up
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(1)}
                  disabled={
                    isSubmitting || activeQuestionIndex >= form.questions.length - 1
                  }
                  className={getAdminCancelButtonClass("modal")}
                >
                  Move Down
                </button>
              </div>
            </div>
          </div>

          {showError("questions") && (
            <p className="text-xs text-[var(--admin-danger-text)]">{showError("questions")}</p>
          )}

          {activeQuestion && (
            <QuestionTypeSection
              question={activeQuestion}
              inputClass={inputClass}
              onChange={updateActiveQuestion}
              showTypeError={
                activeTouched.questionType ? activeErrors.questionType : ""
              }
              showOptionsError={activeTouched.options ? activeErrors.options : ""}
              onTouchType={() => touchQuestion(activeQuestionIndex, "questionType")}
              onTouchOptions={() => touchQuestion(activeQuestionIndex, "options")}
            />
          )}

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
