const STORAGE_KEY = "profiling-questions";

export const QUESTION_TYPES = [
  "Text Box",
  "Text Area",
  "Checkbox",
  "Dropdown",
  "Radio Button",
];

export const OPTION_QUESTION_TYPES = ["Checkbox", "Dropdown", "Radio Button"];

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
    questionType: "Text Area",
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
    questionType: "Text Box",
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
    questionType: "Text Area",
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
