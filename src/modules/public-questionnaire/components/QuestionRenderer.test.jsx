import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import QuestionRenderer from "./QuestionRenderer";

function Harness({ questionType, initialValue }) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <QuestionRenderer
        question={{ id: 1, questionText: "Pick", questionType, options: ["A", "B", "C"] }}
        value={value}
        onChange={setValue}
      />
      <output data-testid="value">{JSON.stringify(value ?? null)}</output>
    </>
  );
}

const currentValue = () => JSON.parse(screen.getByTestId("value").textContent);

describe("QuestionRenderer selection mode by question type", () => {
  it.each(["checkbox", "Checkbox"])("%s allows multiple selections", (questionType) => {
    render(<Harness questionType={questionType} initialValue={[]} />);
    expect(screen.queryByRole("radio")).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: "A" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "C" }));
    expect(currentValue()).toEqual(["A", "C"]);
    expect(screen.getByRole("checkbox", { name: "A" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "C" })).toBeChecked();

    fireEvent.click(screen.getByRole("checkbox", { name: "A" }));
    expect(currentValue()).toEqual(["C"]);
  });

  it.each(["radio", "Radio Button"])("%s allows only one selection", (questionType) => {
    render(<Harness questionType={questionType} initialValue="" />);
    expect(screen.queryByRole("checkbox")).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "A" }));
    fireEvent.click(screen.getByRole("radio", { name: "B" }));
    expect(currentValue()).toBe("B");
    expect(screen.getByRole("radio", { name: "A" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "B" })).toBeChecked();
  });

  it("dropdown allows only one selection", () => {
    const onChange = vi.fn();
    render(
      <QuestionRenderer
        question={{ id: 1, questionText: "Pick", questionType: "dropdown", options: ["A", "B"] }}
        value=""
        onChange={onChange}
      />
    );
    const select = screen.getByRole("combobox", { name: "Pick" });
    expect(select).not.toHaveAttribute("multiple");
    fireEvent.change(select, { target: { value: "B" } });
    expect(onChange).toHaveBeenCalledWith("B");
  });
});
