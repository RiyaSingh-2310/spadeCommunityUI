/** @type {import('../types').QuestionOption[]} */
export const QUESTION_OPTIONS = [
  {
    id: "diagnosed_diseases",
    label: "Have you been earlier diagnosed with below diseases?",
  },
  {
    id: "physician",
    label: "Are you a Physician / General Physician / Specialist?",
  },
  { id: "specialty", label: "Please tell us your specialty area" },
  { id: "country", label: "Please select your country" },
  { id: "ethnicity", label: "Please select your ethnicity" },
  { id: "gender", label: "Please select your gender" },
];

/** @type {Record<string, string[]>} */
export const ANSWERS_BY_QUESTION = {
  diagnosed_diseases: [
    "Acne",
    "Diabetes",
    "Hypertension",
    "Asthma",
    "Arthritis",
    "Migraine",
  ],
  physician: ["Yes", "No"],
  specialty: [
    "Cardiology",
    "Dermatology",
    "Neurology",
    "General Practice",
    "Pediatrics",
  ],
  country: ["India", "USA", "UK", "Canada", "Germany"],
  ethnicity: ["Asian", "Black", "Hispanic", "White", "Other"],
  gender: ["Male", "Female", "Transgender"],
};

export const EMAIL_TEMPLATE_OPTIONS = [
  "New Survey Arrived",
  "Survey Reminder",
  "Survey Re-Invite",
  "Reward Notification",
];

export function getAnswersForQuestion(questionId) {
  return ANSWERS_BY_QUESTION[questionId] ?? [];
}

export function getQuestionLabel(questionId) {
  return QUESTION_OPTIONS.find((q) => q.id === questionId)?.label ?? "";
}
