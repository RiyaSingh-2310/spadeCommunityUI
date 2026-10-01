import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../api/client";
import {
  formatQuestionLibraryRightAnswer,
  mapQuestionToForm,
  questionTypeAllowsMultipleRightAnswers,
  resolveQuestionLibraryRightAnswers,
  saveRecord,
  serializeQuestionLibraryRightAnswer,
} from "./questionLibraryApi";

const BASE_PAYLOAD = {
  language: "English",
  questionnaireTitle: "Pick colours",
  required: false,
  sortOrder: 1,
  status: "Active",
  options: ["A", "B", "C", "D"],
};

function lastRequestBody() {
  return vi.mocked(apiRequest).mock.calls.at(-1)[1].body;
}

describe("questionTypeAllowsMultipleRightAnswers", () => {
  it("is true only for Checkbox", () => {
    expect(questionTypeAllowsMultipleRightAnswers("Checkbox")).toBe(true);
    expect(questionTypeAllowsMultipleRightAnswers("checkbox")).toBe(true);
    expect(questionTypeAllowsMultipleRightAnswers("Dropdown")).toBe(false);
    expect(questionTypeAllowsMultipleRightAnswers("Radio Button")).toBe(false);
    expect(questionTypeAllowsMultipleRightAnswers("radio")).toBe(false);
  });
});

describe("serializeQuestionLibraryRightAnswer", () => {
  it("keeps single answers as the existing plain string", () => {
    expect(serializeQuestionLibraryRightAnswer(" B ", "Dropdown")).toBe("B");
    expect(serializeQuestionLibraryRightAnswer("B", "Radio Button")).toBe("B");
    expect(serializeQuestionLibraryRightAnswer(["C"], "Checkbox")).toBe("C");
  });

  it("stores multiple Checkbox answers as a de-duplicated JSON array string", () => {
    expect(serializeQuestionLibraryRightAnswer(["A", "C", "D", "C", " "], "Checkbox")).toBe(
      '["A","C","D"]'
    );
  });

  it("never sends multiple answers for single-answer types", () => {
    expect(serializeQuestionLibraryRightAnswer(["A", "C"], "Radio Button")).toBe("A");
    expect(serializeQuestionLibraryRightAnswer([], "Checkbox")).toBe("");
  });
});

describe("resolveQuestionLibraryRightAnswers", () => {
  const record = (rightAnswer, options = ["A", "B", "C", "D"]) => ({
    question_type: "checkbox",
    right_answer: rightAnswer,
    options,
  });

  it("reads JSON array strings, arrays, legacy single values, and comma lists", () => {
    expect(resolveQuestionLibraryRightAnswers(record('["A","C","D"]'))).toEqual(["A", "C", "D"]);
    expect(resolveQuestionLibraryRightAnswers(record(["B", "D"]))).toEqual(["B", "D"]);
    expect(resolveQuestionLibraryRightAnswers(record("C"))).toEqual(["C"]);
    expect(resolveQuestionLibraryRightAnswers(record("A, D"))).toEqual(["A", "D"]);
  });

  it("keeps an option whose text contains a comma as one answer", () => {
    expect(
      resolveQuestionLibraryRightAnswers(record("Yes, always", ["Yes, always", "Never"]))
    ).toEqual(["Yes, always"]);
    expect(
      resolveQuestionLibraryRightAnswers(record('["Yes, always","Never"]', ["Yes, always", "Never"]))
    ).toEqual(["Yes, always", "Never"]);
  });

  it("is empty for types without a right answer", () => {
    expect(
      resolveQuestionLibraryRightAnswers({ question_type: "textbox", right_answer: "x" })
    ).toEqual([]);
  });

  it("is exposed on the edit form and list display", () => {
    const saved = record('["A","C","D"]');
    expect(mapQuestionToForm(saved).rightAnswers).toEqual(["A", "C", "D"]);
    expect(formatQuestionLibraryRightAnswer(saved)).toBe("A, C, D");
  });
});

describe("saveRecord right_answer payload", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
    vi.mocked(apiRequest).mockResolvedValue({ success: true, message: "ok", data: { id: 9 } });
  });

  it("creates Dropdown and Radio questions with a single string answer", async () => {
    await saveRecord({ ...BASE_PAYLOAD, questionType: "Dropdown", rightAnswer: "B" });
    expect(lastRequestBody()).toMatchObject({ question_type: "dropdown", right_answer: "B" });

    await saveRecord({ ...BASE_PAYLOAD, questionType: "Radio Button", rightAnswer: "C" });
    expect(lastRequestBody()).toMatchObject({ question_type: "radio", right_answer: "C" });
  });

  it("creates a Checkbox question with multiple answers in the same right_answer field", async () => {
    await saveRecord({ ...BASE_PAYLOAD, questionType: "Checkbox", rightAnswer: ["A", "C", "D"] });
    const body = lastRequestBody();
    expect(body.right_answer).toBe('["A","C","D"]');
    expect(body.options).toEqual(["A", "B", "C", "D"]);
  });

  it("updates a Checkbox question and clears the answer when none is selected", async () => {
    await saveRecord({ ...BASE_PAYLOAD, id: 4, questionType: "Checkbox", rightAnswer: ["B", "D"] });
    expect(vi.mocked(apiRequest).mock.calls.at(-1)[1].method).toBe("PUT");
    expect(lastRequestBody().right_answer).toBe('["B","D"]');

    await saveRecord({ ...BASE_PAYLOAD, id: 4, questionType: "Checkbox", rightAnswer: [] });
    expect(lastRequestBody().right_answer).toBeNull();
  });
});
