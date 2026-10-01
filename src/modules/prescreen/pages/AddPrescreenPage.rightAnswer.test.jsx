import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../../services/question-library/questionLibraryApi", async (importOriginal) => ({
  ...(await importOriginal()),
  getRecord: vi.fn(),
  saveRecord: vi.fn(),
}));

vi.mock("../../../services/toast/apiToast", () => ({
  toastApiError: vi.fn(),
  toastApiSuccess: vi.fn(),
}));

vi.mock("../../../components/admin/LanguageSelect", () => ({
  default: ({ value, onChange }) => (
    <select aria-label="Select language" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select</option>
      <option value="English">English</option>
    </select>
  ),
}));

import { getRecord, saveRecord } from "../../../services/question-library/questionLibraryApi";
import AddPrescreenPage from "./AddPrescreenPage";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/prescreen/add" element={<AddPrescreenPage />} />
        <Route path="/prescreen/edit/:id" element={<AddPrescreenPage />} />
        <Route path="/prescreen" element={<div>Question Library list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const rightAnswerTrigger = () => screen.getByRole("button", { name: "Select right answer" });
const menu = () => screen.getByRole("listbox", { name: "Select right answer" });
const option = (label) => within(menu()).getByRole("option", { name: label });

function chooseFromSelect(triggerName, label) {
  fireEvent.click(screen.getByRole("button", { name: triggerName }));
  fireEvent.click(screen.getByRole("option", { name: label }));
}

function fillBaseFields(questionType) {
  fireEvent.change(screen.getByLabelText("Select language"), { target: { value: "English" } });
  fireEvent.change(screen.getByPlaceholderText("Enter Question Title"), {
    target: { value: "Pick letters" },
  });
  chooseFromSelect("Select question type", questionType);
  fireEvent.change(screen.getByLabelText("Options"), { target: { value: "A\nB\nC\nD" } });
}

describe("AddPrescreenPage right answer", () => {
  beforeEach(() => {
    vi.mocked(saveRecord).mockReset().mockResolvedValue({ success: true, message: "ok" });
    vi.mocked(getRecord).mockReset();
  });

  it("Checkbox: selects multiple answers with checkboxes, keeps them on reopen, and saves all", async () => {
    renderAt("/prescreen/add");
    fillBaseFields("Checkbox");

    fireEvent.click(rightAnswerTrigger());
    ["A", "B", "C", "D"].forEach((label) => {
      expect(within(option(label)).getByRole("checkbox", { hidden: true })).not.toBeChecked();
    });

    fireEvent.click(option("D"));
    fireEvent.click(option("A"));
    fireEvent.click(option("C"));
    expect(menu()).toBeInTheDocument();

    fireEvent.click(rightAnswerTrigger());
    expect(rightAnswerTrigger()).toHaveTextContent("A, C, D");

    fireEvent.click(rightAnswerTrigger());
    expect(within(option("A")).getByRole("checkbox", { hidden: true })).toBeChecked();
    expect(within(option("B")).getByRole("checkbox", { hidden: true })).not.toBeChecked();
    expect(within(option("C")).getByRole("checkbox", { hidden: true })).toBeChecked();
    fireEvent.click(rightAnswerTrigger());

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit" })));

    expect(saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        questionType: "Checkbox",
        rightAnswer: ["A", "C", "D"],
        options: ["A", "B", "C", "D"],
      })
    );
  });

  it("Checkbox: unchecking removes an answer and removed options drop out", () => {
    renderAt("/prescreen/add");
    fillBaseFields("Checkbox");

    fireEvent.click(rightAnswerTrigger());
    fireEvent.click(option("A"));
    fireEvent.click(option("B"));
    fireEvent.click(option("A"));
    fireEvent.click(rightAnswerTrigger());
    expect(rightAnswerTrigger()).toHaveTextContent(/^B$/);

    fireEvent.click(rightAnswerTrigger());
    fireEvent.click(option("D"));
    fireEvent.click(rightAnswerTrigger());
    fireEvent.change(screen.getByLabelText("Options"), { target: { value: "A\nB\nC" } });
    expect(rightAnswerTrigger()).toHaveTextContent(/^B$/);
  });

  it("Radio: shows radio buttons and keeps exactly one answer", async () => {
    renderAt("/prescreen/add");
    fillBaseFields("Radio Button");

    fireEvent.click(rightAnswerTrigger());
    expect(within(option("A")).getByRole("radio", { hidden: true })).not.toBeChecked();
    fireEvent.click(option("B"));

    fireEvent.click(rightAnswerTrigger());
    expect(within(option("B")).getByRole("radio", { hidden: true })).toBeChecked();
    fireEvent.click(option("C"));
    expect(rightAnswerTrigger()).toHaveTextContent(/^C$/);

    fireEvent.click(rightAnswerTrigger());
    expect(within(option("B")).getByRole("radio", { hidden: true })).not.toBeChecked();
    expect(within(option("C")).getByRole("radio", { hidden: true })).toBeChecked();
    fireEvent.click(rightAnswerTrigger());

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit" })));
    expect(saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({ questionType: "Radio Button", rightAnswer: "C" })
    );
  });

  it("Dropdown: stays a plain single-select", async () => {
    renderAt("/prescreen/add");
    fillBaseFields("Dropdown");

    fireEvent.click(rightAnswerTrigger());
    expect(within(menu()).queryByRole("radio", { hidden: true })).toBeNull();
    expect(within(menu()).queryByRole("checkbox", { hidden: true })).toBeNull();
    fireEvent.click(option("D"));
    expect(rightAnswerTrigger()).toHaveTextContent(/^D$/);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit" })));
    expect(saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({ questionType: "Dropdown", rightAnswer: "D" })
    );
  });

  it("switching Checkbox → Radio keeps a single answer and clears an ambiguous set", () => {
    renderAt("/prescreen/add");
    fillBaseFields("Checkbox");

    fireEvent.click(rightAnswerTrigger());
    fireEvent.click(option("B"));
    fireEvent.click(rightAnswerTrigger());
    chooseFromSelect("Select question type", "Radio Button");
    expect(rightAnswerTrigger()).toHaveTextContent(/^B$/);

    chooseFromSelect("Select question type", "Checkbox");
    expect(rightAnswerTrigger()).toHaveTextContent(/^B$/);
    fireEvent.click(rightAnswerTrigger());
    fireEvent.click(option("C"));
    fireEvent.click(rightAnswerTrigger());
    chooseFromSelect("Select question type", "Dropdown");
    expect(rightAnswerTrigger()).toHaveTextContent("Select Right Answer");
  });

  it("switching Dropdown ↔ Radio → Checkbox moves between single and multiple selection", async () => {
    renderAt("/prescreen/add");
    fillBaseFields("Dropdown");

    fireEvent.click(rightAnswerTrigger());
    fireEvent.click(option("A"));
    chooseFromSelect("Select question type", "Radio Button");
    expect(rightAnswerTrigger()).toHaveTextContent(/^A$/);
    fireEvent.click(rightAnswerTrigger());
    fireEvent.click(option("B"));
    expect(rightAnswerTrigger()).toHaveTextContent(/^B$/);

    chooseFromSelect("Select question type", "Checkbox");
    fireEvent.click(rightAnswerTrigger());
    expect(within(option("B")).getByRole("checkbox", { hidden: true })).toBeChecked();
    fireEvent.click(option("D"));
    fireEvent.click(rightAnswerTrigger());
    expect(rightAnswerTrigger()).toHaveTextContent("B, D");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit" })));
    expect(saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({ questionType: "Checkbox", rightAnswer: ["B", "D"] })
    );
  });

  it("edit: legacy single-string answers still load for Checkbox and Radio questions", async () => {
    vi.mocked(getRecord).mockResolvedValue({
      id: 5,
      language: "english",
      question_title: "Pick letters",
      question_type: "checkbox",
      options: ["A", "B", "C", "D"],
      right_answer: "B",
      status: "active",
    });
    const { unmount } = renderAt("/prescreen/edit/5");
    await waitFor(() => expect(rightAnswerTrigger()).toHaveTextContent(/^B$/));
    fireEvent.click(rightAnswerTrigger());
    expect(within(option("B")).getByRole("checkbox", { hidden: true })).toBeChecked();
    expect(within(option("A")).getByRole("checkbox", { hidden: true })).not.toBeChecked();
    unmount();

    vi.mocked(getRecord).mockResolvedValue({
      id: 6,
      language: "english",
      question_title: "Pick one",
      question_type: "radio",
      options: ["A", "B", "C", "D"],
      right_answer: "C",
      status: "active",
    });
    renderAt("/prescreen/edit/6");
    await waitFor(() => expect(rightAnswerTrigger()).toHaveTextContent(/^C$/));
    fireEvent.click(rightAnswerTrigger());
    expect(within(option("C")).getByRole("radio", { hidden: true })).toBeChecked();
  });

  it("edit: loads saved Checkbox answers and enables Update only after a change", async () => {
    vi.mocked(getRecord).mockResolvedValue({
      id: 4,
      language: "english",
      question_title: "Pick letters",
      question_type: "checkbox",
      options: ["A", "B", "C", "D"],
      right_answer: '["A","C","D"]',
      status: "active",
    });
    renderAt("/prescreen/edit/4");

    await waitFor(() => expect(rightAnswerTrigger()).toHaveTextContent("A, C, D"));
    const update = screen.getByRole("button", { name: "Update" });
    expect(update).toBeDisabled();

    fireEvent.click(rightAnswerTrigger());
    fireEvent.click(option("B"));
    fireEvent.click(rightAnswerTrigger());
    expect(rightAnswerTrigger()).toHaveTextContent("A, B, C, D");
    expect(update).toBeEnabled();

    await act(async () => fireEvent.click(update));
    expect(saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({ id: "4", rightAnswer: ["A", "B", "C", "D"] })
    );
  });
});
