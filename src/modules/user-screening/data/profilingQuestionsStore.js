/**
 * Question-type helpers for User Screening forms.
 * CRUD is handled by /api/panel-questionnaire via screeningQuestionsApi.
 * This module must not persist records to localStorage.
 */

export const QUESTION_TYPES = [
  "Text Box",
  "Text Area",
  "Dropdown",
  "Radio Button",
  "Checkbox",
  "Number",
  "Date",
  "Time",
  "Date-Time",
];

export const SIMPLE_OPTION_QUESTION_TYPES = ["Dropdown"];
export const LABELED_OPTION_QUESTION_TYPES = ["Radio Button", "Checkbox"];
export const OPTION_QUESTION_TYPES = [
  ...SIMPLE_OPTION_QUESTION_TYPES,
  ...LABELED_OPTION_QUESTION_TYPES,
];

export function needsQuestionOptions(questionType) {
  return OPTION_QUESTION_TYPES.includes(questionType);
}

export function isLabeledOptionQuestionType(questionType) {
  return LABELED_OPTION_QUESTION_TYPES.includes(questionType);
}

export function isSimpleOptionQuestionType(questionType) {
  return SIMPLE_OPTION_QUESTION_TYPES.includes(questionType);
}

export function normalizeQuestionTypeLabel(questionType) {
  const label = String(questionType ?? "").trim();
  if (label === "Date Time") return "Date-Time";
  return label;
}

export function createEmptyOption(questionType = "Dropdown") {
  if (isLabeledOptionQuestionType(questionType)) {
    return { label: "", value: "" };
  }
  return "";
}

export function normalizeOptionsForQuestionType(options, questionType) {
  const type = normalizeQuestionTypeLabel(questionType);

  if (!needsQuestionOptions(type)) {
    return [createEmptyOption(type)];
  }

  if (isLabeledOptionQuestionType(type)) {
    if (!Array.isArray(options) || options.length === 0) {
      return [createEmptyOption(type)];
    }

    const normalized = options
      .map((option) => {
        if (typeof option === "string") {
          const trimmed = option.trim();
          if (!trimmed) return null;
          const valueFromLabel = trimmed.toLowerCase();
          return { label: trimmed, value: valueFromLabel };
        }
        if (typeof option === "object" && option) {
          const label = String(option.label ?? option.option_text ?? option.optionText ?? "").trim();
          const value = String(
            option.value ?? option.mapped_option ?? option.mappedOption ?? label
          ).trim();
          if (!label && !value) return null;
          return { label: label || value, value: value || label };
        }
        return null;
      })
      .filter(Boolean);

    return normalized.length > 0 ? normalized : [createEmptyOption(type)];
  }

  if (!Array.isArray(options) || options.length === 0) {
    return [createEmptyOption(type)];
  }

  const normalized = options
    .map((option) => {
      if (typeof option === "string") return option;
      if (typeof option === "object" && option) {
        return String(option.label ?? option.value ?? option.option_text ?? "").trim();
      }
      return "";
    });

  return normalized.length > 0 ? normalized : [createEmptyOption(type)];
}

export const LANGUAGES = ["English", "Arabic", "German", "French", "Spanish"];

export function createEmptyQuestionItem() {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    questionText: "",
    questionType: "",
    options: [createEmptyOption()],
    required: false,
  };
}

/** Convert stored option arrays to newline-separated textarea text. */
export function optionsArrayToTextarea(options, questionType) {
  const type = normalizeQuestionTypeLabel(questionType);
  if (!needsQuestionOptions(type)) return "";

  const normalized = normalizeOptionsForQuestionType(options, type);
  if (isLabeledOptionQuestionType(type)) {
    return normalized
      .map((option) => option?.label?.trim() || option?.value?.trim() || "")
      .filter(Boolean)
      .join("\n");
  }

  return normalized.map((option) => String(option ?? "").trim()).filter(Boolean).join("\n");
}

/** Parse newline-separated textarea text into option arrays for the given type. */
export function parseOptionsTextarea(text, questionType) {
  const type = normalizeQuestionTypeLabel(questionType);
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return normalizeOptionsForQuestionType(lines, type);
}

export function optionsTextareaHasContent(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .some((line) => line.trim());
}
