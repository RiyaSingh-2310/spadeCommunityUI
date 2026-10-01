import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import LanguageSelect from "../../../components/admin/LanguageSelect";
import SearchableMultiSelect from "../../../components/admin/SearchableMultiSelect";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  getRecord,
  mapQuestionToForm,
  QUESTION_LIBRARY_RIGHT_ANSWER_MAX_LENGTH,
  questionTypeAllowsMultipleRightAnswers,
  saveRecord,
  serializeQuestionLibraryRightAnswer,
} from "../../../services/question-library/questionLibraryApi";
import {
  getAdminCancelButtonClass,
  getAdminInputClass,
  getAdminTextareaClass,
} from "../../shared/utils/formStyles";
import { limitTextInput, NAME_FIELD_MAX_LENGTH } from "../../shared/utils/validation";
import {
  needsQuestionOptions,
  normalizeQuestionTypeLabel,
  QUESTION_TYPES,
} from "../../user-screening/data/profilingQuestionsStore";

const OPTIONS_MAX_HEIGHT = 200;

const EMPTY_FORM = {
  language: "",
  questionTitle: "",
  questionType: "",
  optionsText: "",
  rightAnswer: "",
  rightAnswers: [],
  required: false,
  status: "Active",
};

function parseOptionsText(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function syncRightAnswer(rightAnswer, options) {
  const trimmed = rightAnswer.trim();
  if (!trimmed) return "";
  return options.includes(trimmed) ? trimmed : "";
}

/** Keeps only answers that are still options, de-duplicated, in option order. */
function syncRightAnswers(rightAnswers, options) {
  const selected = new Set(rightAnswers.map((answer) => String(answer).trim()));
  return [...new Set(options)].filter((option) => selected.has(option));
}

function isPrescreenFormDirty(current, original) {
  if (!original) return false;
  return (
    current.language !== original.language ||
    current.questionTitle !== original.questionTitle ||
    current.questionType !== original.questionType ||
    current.optionsText !== original.optionsText ||
    current.rightAnswer !== original.rightAnswer ||
    current.rightAnswers.join("\n") !== original.rightAnswers.join("\n") ||
    current.required !== original.required
  );
}

function getRightAnswerLengthError(form) {
  if (!questionTypeAllowsMultipleRightAnswers(form.questionType)) return "";
  const serialized = serializeQuestionLibraryRightAnswer(form.rightAnswers, form.questionType);
  return serialized.length > QUESTION_LIBRARY_RIGHT_ANSWER_MAX_LENGTH
    ? `Selected right answers are too long to save (maximum ${QUESTION_LIBRARY_RIGHT_ANSWER_MAX_LENGTH} characters). Select fewer or shorter options.`
    : "";
}

function isPrescreenFormValid(form) {
  if (!form.language.trim() || !form.questionTitle.trim() || !form.questionType.trim()) {
    return false;
  }

  const questionType = normalizeQuestionTypeLabel(form.questionType);
  if (needsQuestionOptions(questionType)) {
    const options = parseOptionsText(form.optionsText);
    if (!options.length) return false;
    if (questionTypeAllowsMultipleRightAnswers(questionType)) {
      return (
        form.rightAnswers.length > 0 &&
        form.rightAnswers.every((answer) => options.includes(answer)) &&
        !getRightAnswerLengthError(form)
      );
    }
    if (!form.rightAnswer.trim()) return false;
    return options.includes(form.rightAnswer.trim());
  }

  return true;
}

function AddPrescreenPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const optionsRef = useRef(null);

  const inputClass = getAdminInputClass();
  const textareaClass = getAdminTextareaClass();

  const adjustOptionsHeight = useCallback(() => {
    const textarea = optionsRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, OPTIONS_MAX_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > OPTIONS_MAX_HEIGHT ? "auto" : "hidden";
    textarea.style.overflowX = "hidden";
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadPrescreen = async () => {
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const record = await getRecord(id);
        if (cancelled) return;
        const mapped = mapQuestionToForm(record);
        const questionType = normalizeQuestionTypeLabel(mapped.questionType) || "Text Box";
        const allowsMultiple = questionTypeAllowsMultipleRightAnswers(questionType);
        const nextForm = {
          language: mapped.language ?? "",
          questionTitle: mapped.questionTitle ?? "",
          questionType,
          optionsText: mapped.mappedOptions ?? "",
          rightAnswer: allowsMultiple ? "" : mapped.rightAnswer ?? "",
          rightAnswers: allowsMultiple ? mapped.rightAnswers ?? [] : [],
          required: Boolean(mapped.required),
          status: mapped.status ?? "Active",
        };
        setForm(nextForm);
        setInitialSnapshot(nextForm);
      } catch {
        if (cancelled) return;
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadPrescreen();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  useEffect(() => {
    adjustOptionsHeight();
  }, [form.optionsText, adjustOptionsHeight]);

  const rightAnswerOptions = useMemo(() => {
    const options = parseOptionsText(form.optionsText);
    const savedAnswers = [form.rightAnswer.trim(), ...form.rightAnswers].filter(Boolean);
    const missing = savedAnswers.filter((answer) => !options.includes(answer));
    return missing.length ? [...new Set([...options, ...missing])] : options;
  }, [form.optionsText, form.rightAnswer, form.rightAnswers]);

  const showOptionsField = needsQuestionOptions(normalizeQuestionTypeLabel(form.questionType));
  const normalizedQuestionType = normalizeQuestionTypeLabel(form.questionType);
  const allowsMultipleRightAnswers =
    questionTypeAllowsMultipleRightAnswers(normalizedQuestionType);
  const rightAnswerLengthError = getRightAnswerLengthError(form);

  const isDirty = useMemo(
    () => isEdit && isPrescreenFormDirty(form, initialSnapshot),
    [isEdit, form, initialSnapshot]
  );

  const canSubmit = useMemo(() => {
    if (!isPrescreenFormValid(form) || isSubmitting || isLoadingRecord || loadFailed) {
      return false;
    }
    if (isEdit) return isDirty;
    return true;
  }, [form, isSubmitting, isEdit, isDirty, isLoadingRecord, loadFailed]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleQuestionTypeChange = (questionType) => {
    const normalizedType = normalizeQuestionTypeLabel(questionType);
    setForm((prev) => {
      if (!needsQuestionOptions(normalizedType)) {
        return {
          ...prev,
          questionType: normalizedType,
          optionsText: "",
          rightAnswer: "",
          rightAnswers: [],
        };
      }

      const options = parseOptionsText(prev.optionsText);
      const previousAnswers = questionTypeAllowsMultipleRightAnswers(prev.questionType)
        ? prev.rightAnswers
        : [prev.rightAnswer].filter((answer) => answer.trim());

      if (questionTypeAllowsMultipleRightAnswers(normalizedType)) {
        return {
          ...prev,
          questionType: normalizedType,
          rightAnswer: "",
          rightAnswers: syncRightAnswers(previousAnswers, options),
        };
      }

      // A single-answer type keeps the previous answer only when it is unambiguous.
      return {
        ...prev,
        questionType: normalizedType,
        rightAnswer: previousAnswers.length === 1 ? previousAnswers[0] : "",
        rightAnswers: [],
      };
    });
  };

  const handleOptionsTextChange = (value) => {
    setForm((prev) => {
      const options = parseOptionsText(value);
      return {
        ...prev,
        optionsText: value,
        rightAnswer: syncRightAnswer(prev.rightAnswer, options),
        rightAnswers: syncRightAnswers(prev.rightAnswers, options),
      };
    });
  };

  const handleRightAnswersChange = (answers) => {
    setForm((prev) => ({
      ...prev,
      rightAnswers: syncRightAnswers(answers, parseOptionsText(prev.optionsText)),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || (isEdit && !isDirty)) return;

    const mappedLines = parseOptionsText(form.optionsText);
    const questionType = normalizeQuestionTypeLabel(form.questionType);

    setIsSubmitting(true);
    try {
      const data = await saveRecord({
        id: isEdit ? id : undefined,
        language: form.language.trim(),
        questionnaireTitle: form.questionTitle.trim(),
        questionType,
        required: form.required,
        rightAnswer: !showOptionsField
          ? null
          : allowsMultipleRightAnswers
            ? form.rightAnswers
            : form.rightAnswer.trim(),
        sortOrder: 1,
        status: isEdit ? initialSnapshot?.status ?? form.status : "Active",
        options: showOptionsField ? mappedLines : [],
      });

      toastApiSuccess(
        data,
        isEdit ? "Prescreen updated successfully." : "Prescreen added successfully."
      );

      navigate("/prescreen", {
        replace: true,
        state: { refresh: true },
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbLibrary = { label: "Question Library", to: "/prescreen" };

  if (isEdit && isLoadingRecord) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Question"
          breadcrumbs={[breadcrumbLibrary, { label: "Edit Question" }]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading prescreen...
        </div>
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Question"
          breadcrumbs={[breadcrumbLibrary, { label: "Edit Question" }]}
          isDarkMode={isDarkMode}
        />
        <p className="admin-text-muted text-sm">Prescreen not found.</p>
        <button
          type="button"
          onClick={() => navigate("/prescreen")}
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
        title={isEdit ? "Edit Question" : "Add Question"}
        breadcrumbs={[
          breadcrumbLibrary,
          { label: isEdit ? "Edit Question" : "Add Question" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Prescreen Details" isDarkMode={isDarkMode}>
        <form className="admin-form-root space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="admin-form-grid-2">
            <FormField label="Language" required>
              <LanguageSelect
                inputClass={inputClass}
                value={form.language}
                onChange={(language) => setField("language", language)}
              />
            </FormField>
            <FormField label="Question Title" required>
              <input
                className={inputClass}
                placeholder="Enter Question Title"
                value={form.questionTitle}
                maxLength={NAME_FIELD_MAX_LENGTH}
                onChange={(e) =>
                  setField("questionTitle", limitTextInput(e.target.value, NAME_FIELD_MAX_LENGTH))
                }
              />
            </FormField>
          </div>

          <div className="admin-type-required-row">
            <FormField label="Question Type" required className="admin-type-required-row__type min-w-0">
              <SearchableSelect
                inputClass={inputClass}
                value={form.questionType}
                onChange={handleQuestionTypeChange}
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
                checked={form.required}
                onChange={(event) => setField("required", event.target.checked)}
                className="admin-checkbox shrink-0"
              />
              <span className="font-semibold">Required</span>
            </label>
          </div>

          {showOptionsField && (
            <>
              <FormField label="Options" required>
                <textarea
                  ref={optionsRef}
                  className={`${textareaClass} w-full min-h-[8rem]`}
                  value={form.optionsText}
                  onChange={(e) => handleOptionsTextChange(e.target.value)}
                  placeholder={"Option A\nOption B\nOption C"}
                  aria-label="Options"
                  style={{
                    resize: "none",
                    overflowX: "hidden",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                />
              </FormField>

              <FormField label="Right Answer" required error={rightAnswerLengthError}>
                {allowsMultipleRightAnswers ? (
                  <SearchableMultiSelect
                    inputClass={inputClass}
                    value={form.rightAnswers}
                    onChange={handleRightAnswersChange}
                    options={rightAnswerOptions}
                    placeholder="Select Right Answer"
                    searchPlaceholder="Search answer..."
                    aria-label="Select right answer"
                    disabled={rightAnswerOptions.length === 0}
                  />
                ) : (
                  <SearchableSelect
                    inputClass={inputClass}
                    value={form.rightAnswer}
                    onChange={(rightAnswer) => setField("rightAnswer", rightAnswer)}
                    options={rightAnswerOptions}
                    placeholder="Select Right Answer"
                    searchPlaceholder="Search answer..."
                    aria-label="Select right answer"
                    disabled={rightAnswerOptions.length === 0}
                    optionIndicator={normalizedQuestionType === "Radio Button" ? "radio" : undefined}
                  />
                )}
              </FormField>
            </>
          )}

          <div className="admin-form-actions flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? "Update" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/prescreen")}
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

export default AddPrescreenPage;
