/**
 * Static sample questionnaire for the public UI.
 * Swap this data source for an API response later without changing the page UI.
 */

export const SAMPLE_QUESTIONNAIRE = {
  id: "sample-questionnaire-001",
  surveyTitle: "Consumer Preferences Survey",
  language: "English",
  questions: [
    {
      id: "q1",
      questionText: "What is your age group?",
      questionType: "Radio Button",
      required: true,
      options: [
        { label: "18 – 24", value: "18-24" },
        { label: "25 – 34", value: "25-34" },
        { label: "35 – 44", value: "35-44" },
        { label: "45 – 54", value: "45-54" },
        { label: "55+", value: "55+" },
      ],
    },
    {
      id: "q2",
      questionText: "Which of the following best describes your current employment status?",
      questionType: "Dropdown",
      required: true,
      options: [
        { label: "Employed full-time", value: "full-time" },
        { label: "Employed part-time", value: "part-time" },
        { label: "Self-employed", value: "self-employed" },
        { label: "Student", value: "student" },
        { label: "Unemployed", value: "unemployed" },
        { label: "Retired", value: "retired" },
      ],
    },
    {
      id: "q3",
      questionText: "Which product categories interest you? (Select all that apply)",
      questionType: "Checkbox",
      required: true,
      options: [
        { label: "Technology & gadgets", value: "tech" },
        { label: "Fashion & apparel", value: "fashion" },
        { label: "Health & wellness", value: "health" },
        { label: "Food & beverages", value: "food" },
        { label: "Travel & leisure", value: "travel" },
        { label: "Home & lifestyle", value: "home" },
      ],
    },
    {
      id: "q4",
      questionText: "How often do you participate in online surveys?",
      questionType: "Radio Button",
      required: true,
      options: [
        { label: "Daily", value: "daily" },
        { label: "A few times a week", value: "weekly" },
        { label: "A few times a month", value: "monthly" },
        { label: "Rarely", value: "rarely" },
        { label: "This is my first time", value: "first" },
      ],
    },
    {
      id: "q5",
      questionText: "Is there anything else you would like us to know?",
      questionType: "Text",
      required: false,
      options: [],
    },
  ],
};

/**
 * Fetches questionnaire data. Currently returns static sample data.
 * Replace the body with an API call when backend integration is ready.
 */
export async function fetchPublicQuestionnaire(id) {
  return {
    ...SAMPLE_QUESTIONNAIRE,
    id: id || SAMPLE_QUESTIONNAIRE.id,
  };
}
