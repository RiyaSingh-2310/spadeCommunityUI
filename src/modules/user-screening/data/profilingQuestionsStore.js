const STORAGE_KEY = "profiling-questions";

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

const INITIAL_QUESTIONS = [
  {
    id: "pq-1",
    language: "English",
    questionTitle: "What is your gender?",
    questionType: "Radio Button",
    options: "Male\nFemale\nTransgender",
    sortOrder: 0,
    status: "Active",
  },
  {
    id: "pq-2",
    language: "English",
    questionTitle: "Tell us about yourself",
    questionType: "Multi Line Text",
    options: "",
    sortOrder: 1,
    status: "Active",
  },
  {
    id: "pq-3",
    language: "English",
    questionTitle: "Gender",
    questionType: "Radio Button",
    options: "Male\nFemale\nTransgender\nPrefer Not To Say",
    sortOrder: 0,
    status: "Active",
  },
  {
    id: "pq-4",
    language: "English",
    questionTitle: "Age Group",
    questionType: "Dropdown",
    options: "18-24\n25-34\n35-44\n45+",
    sortOrder: 1,
    status: "Active",
  },
  {
    id: "pq-5",
    language: "Arabic",
    questionTitle: "Country",
    questionType: "Dropdown",
    options: "UAE\nSaudi Arabia\nQatar\nKuwait",
    sortOrder: 2,
    status: "Active",
  },
  {
    id: "pq-6",
    language: "German",
    questionTitle: "Occupation",
    questionType: "Single Line Text",
    options: "",
    sortOrder: 3,
    status: "Inactive",
  },
  {
    id: "pq-7",
    language: "French",
    questionTitle: "Which country do you live in?",
    questionType: "Checkbox",
    options: "France\nBelgium\nSwitzerland\nCanada",
    sortOrder: 4,
    status: "Active",
  },
  {
    id: "pq-8",
    language: "English",
    questionTitle: "What is your employment status?",
    questionType: "Dropdown",
    options: "Employed\nSelf-employed\nStudent\nUnemployed",
    sortOrder: 5,
    status: "Active",
  },
  {
    id: "pq-9",
    language: "Spanish",
    questionTitle: "Household income range",
    questionType: "Radio Button",
    options: "Under 25k\n25k-50k\n50k-100k\n100k+",
    sortOrder: 6,
    status: "Active",
  },
  {
    id: "pq-10",
    language: "English",
    questionTitle: "How often do you shop online?",
    questionType: "Radio Button",
    options: "Daily\nWeekly\nMonthly\nRarely",
    sortOrder: 7,
    status: "Inactive",
  },
  {
    id: "pq-11",
    language: "Arabic",
    questionTitle: "Preferred contact method",
    questionType: "Checkbox",
    options: "Email\nPhone\nSMS\nWhatsApp",
    sortOrder: 8,
    status: "Active",
  },
  {
    id: "pq-12",
    language: "German",
    questionTitle: "Additional comments",
    questionType: "Multi Line Text",
    options: "",
    sortOrder: 9,
    status: "Active",
  },
];

function mergeWithInitial(stored) {
  const existingIds = new Set(stored.map((q) => q.id));
  const missing = INITIAL_QUESTIONS.filter((q) => !existingIds.has(q.id));
  return missing.length > 0 ? [...stored, ...missing] : stored;
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...INITIAL_QUESTIONS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [...INITIAL_QUESTIONS];
    return mergeWithInitial(parsed);
  } catch {
    return [...INITIAL_QUESTIONS];
  }
}

function writeStore(questions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export function loadProfilingQuestions() {
  return readStore().sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getProfilingQuestionById(id) {
  return readStore().find((q) => q.id === id) ?? null;
}

export function saveProfilingQuestion(question) {
  const list = readStore();
  const idx = list.findIndex((q) => q.id === question.id);
  const next = idx >= 0 ? list.map((q) => (q.id === question.id ? question : q)) : [...list, question];
  writeStore(next);
  return question;
}

export function createProfilingQuestion(payload) {
  const question = {
    id: `pq-${Date.now()}`,
    ...payload,
  };
  saveProfilingQuestion(question);
  return question;
}

export function deleteProfilingQuestion(id) {
  const next = readStore().filter((q) => q.id !== id);
  writeStore(next);
}

export function updateProfilingQuestionStatus(id, status) {
  const item = getProfilingQuestionById(id);
  if (!item) return;
  saveProfilingQuestion({ ...item, status });
}

export function toListingRows(questions) {
  return questions.map((q, index) => ({
    id: q.id,
    sno: String(index + 1),
    questionTitle: q.questionTitle,
    language: q.language,
    questionType: q.questionType,
    sortOrder: String(q.sortOrder),
    status: q.status,
  }));
}

/**
 * Persists a new display order for all profiling questions.
 * @param {{ id: string }[]} orderedQuestions
 */
export function saveProfilingQuestionOrder(orderedQuestions) {
  const list = readStore();
  const orderById = new Map(
    orderedQuestions.map((question, index) => [question.id, index])
  );

  if (orderById.size !== list.length) {
    throw new Error("All profiling questions must be included in the sort order.");
  }

  const next = list.map((question) => {
    const sortOrder = orderById.get(question.id);
    if (sortOrder == null) {
      throw new Error("All profiling questions must be included in the sort order.");
    }
    return { ...question, sortOrder };
  });

  writeStore(next.sort((a, b) => a.sortOrder - b.sortOrder));
  return next;
}

export function createEmptyQuestionItem() {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    questionText: "",
    questionType: "",
    options: [createEmptyOption()],
    required: false,
  };
}
