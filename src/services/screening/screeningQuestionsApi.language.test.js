import { describe, expect, it } from "vitest";
import {
  buildPanelQuestionnaireCreateBody,
  buildPanelQuestionnaireUpdateBody,
  mapQuestionnaireToForm,
  mapScreeningQuestionToForm,
} from "./screeningQuestionsApi";

describe("panel questionnaire language mapping", () => {
  it("maps a lowercase API language onto the dropdown option value", () => {
    const form = mapQuestionnaireToForm([
      {
        id: 12,
        language: "english",
        question_title: "Demographics",
        question_text: "What is your age?",
        question_type: "textbox",
        is_required: 1,
        status: "active",
      },
    ]);

    expect(form.language).toBe("English");
    expect(form.questionTitle).toBe("Demographics");
    expect(form.questions[0].questionText).toBe("What is your age?");
    expect(form.questions[0].required).toBe(true);
  });

  it("maps language codes and objects without defaulting to English", () => {
    expect(mapScreeningQuestionToForm({ language: "hi", question_type: "textbox" }).language).toBe(
      "Hindi"
    );
    expect(
      mapScreeningQuestionToForm({
        language: { name: "German" },
        question_type: "dropdown",
        options: ["A"],
      }).language
    ).toBe("German");
    expect(mapScreeningQuestionToForm({ question_type: "textbox" }).language).toBe("");
  });

  it("prefills question options and type from the API record", () => {
    const form = mapScreeningQuestionToForm({
      language: "english",
      question_title: "Food",
      question_text: "Pick one",
      question_type: "radio",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
      is_required: 0,
      status: "inactive",
    });

    expect(form.questionType).toBe("Radio Button");
    expect(form.options).toEqual([
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ]);
    expect(form.required).toBe(false);
    expect(form.status).toBe("Inactive");
  });

  it("sends the stored lowercase language on create and update", () => {
    const payload = {
      language: "English",
      questionTitle: "Demographics",
      questionText: "What is your age?",
      questionType: "Text Box",
      options: [],
      required: true,
      status: "Active",
      sortOrder: 1,
    };

    expect(buildPanelQuestionnaireCreateBody(payload).language).toBe("english");
    expect(buildPanelQuestionnaireUpdateBody(payload).language).toBe("english");
  });

  it("does not omit existing fields from an unchanged update payload", () => {
    const body = buildPanelQuestionnaireUpdateBody({
      language: "English",
      questionTitle: "Demographics",
      questionText: "What is your age?",
      questionType: "Text Box",
      options: ["A"],
      required: true,
      sortOrder: 2,
    });

    expect(body).toMatchObject({
      language: "english",
      question_title: "Demographics",
      question_text: "What is your age?",
      question_type: "textbox",
      options: ["A"],
      is_required: 1,
      sort_order: 2,
    });
  });
});
