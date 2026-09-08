import { describe, expect, it } from "vitest";
import {
  formatQuestionLibraryRightAnswer,
  mapQuestionToRow,
  questionTypeShowsRightAnswer,
} from "./questionLibraryApi";

describe("questionTypeShowsRightAnswer", () => {
  it("allows dropdown, radio, and checkbox only", () => {
    expect(questionTypeShowsRightAnswer("dropdown")).toBe(true);
    expect(questionTypeShowsRightAnswer("Dropdown")).toBe(true);
    expect(questionTypeShowsRightAnswer("radio")).toBe(true);
    expect(questionTypeShowsRightAnswer("Radio Button")).toBe(true);
    expect(questionTypeShowsRightAnswer("checkbox")).toBe(true);
    expect(questionTypeShowsRightAnswer("Checkbox")).toBe(true);
    expect(questionTypeShowsRightAnswer("textbox")).toBe(false);
    expect(questionTypeShowsRightAnswer("Text Area")).toBe(false);
    expect(questionTypeShowsRightAnswer("number")).toBe(false);
    expect(questionTypeShowsRightAnswer("date")).toBe(false);
    expect(questionTypeShowsRightAnswer("datetime")).toBe(false);
  });
});

describe("formatQuestionLibraryRightAnswer", () => {
  it("returns a blank value for unsupported question types even when API sends an answer", () => {
    expect(
      formatQuestionLibraryRightAnswer({
        question_type: "textbox",
        right_answer: "Should not show",
      })
    ).toBe("");
    expect(
      formatQuestionLibraryRightAnswer({
        question_type: "datetime",
        right_answer: "2024-01-01",
      })
    ).toBe("");
  });

  it("shows the API right answer for dropdown, radio, and checkbox", () => {
    expect(
      formatQuestionLibraryRightAnswer({
        question_type: "dropdown",
        right_answer: "Yes",
        options: ["Yes", "No"],
      })
    ).toBe("Yes");
    expect(
      formatQuestionLibraryRightAnswer({
        question_type: "radio",
        right_answer: "Male",
        options: ["Male", "Female"],
      })
    ).toBe("Male");
    expect(
      formatQuestionLibraryRightAnswer({
        question_type: "checkbox",
        right_answer: ["Red", "Blue"],
        options: ["Red", "Blue", "Green"],
      })
    ).toBe("Red, Blue");
  });

  it("maps option objects instead of showing [object Object]", () => {
    expect(
      formatQuestionLibraryRightAnswer({
        question_type: "radio",
        right_answer: { option_text: "Agree", value: "agree" },
        options: [
          { option_text: "Agree", value: "agree" },
          { option_text: "Disagree", value: "disagree" },
        ],
      })
    ).toBe("Agree");
  });

  it("uses is_correct flags on options when right_answer is empty", () => {
    expect(
      formatQuestionLibraryRightAnswer({
        question_type: "checkbox",
        right_answer: null,
        options: [
          { option_text: "A", is_correct: true },
          { option_text: "B", is_correct: false },
          { option_text: "C", is_correct: true },
        ],
      })
    ).toBe("A, C");
  });
});

describe("mapQuestionToRow", () => {
  it("keeps Right Answer blank for text questions", () => {
    const row = mapQuestionToRow({
      id: 1,
      question_title: "Name",
      question_type: "textbox",
      right_answer: "Ada",
      language: "english",
      status: "active",
    });
    expect(row.rightAnswer).toBe("");
  });

  it("includes Right Answer for radio questions", () => {
    const row = mapQuestionToRow({
      id: 2,
      question_title: "Gender",
      question_type: "radio",
      right_answer: "Female",
      options: ["Male", "Female"],
      language: "english",
      status: "active",
    });
    expect(row.rightAnswer).toBe("Female");
  });
});
