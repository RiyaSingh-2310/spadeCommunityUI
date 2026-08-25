import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import TableStatusSelect from "./TableStatusSelect";

describe("TableStatusSelect", () => {
  it("renders the current status and notifies on change", () => {
    const onChange = vi.fn();
    const { getByLabelText, getByRole } = render(
      <TableStatusSelect
        value="Active"
        options={["Active", "Inactive"]}
        onChange={onChange}
      />
    );

    const trigger = getByLabelText("Status");
    expect(trigger).toHaveTextContent("Active");
    fireEvent.click(trigger);
    fireEvent.click(getByRole("option", { name: "Inactive" }));
    expect(onChange).toHaveBeenCalledWith("Inactive");
  });

  it("does not open when disabled", () => {
    const onChange = vi.fn();
    const { getByLabelText, queryByRole } = render(
      <TableStatusSelect
        value="Active"
        options={["Active", "Inactive"]}
        disabled
        onChange={onChange}
      />
    );

    fireEvent.click(getByLabelText("Status"));
    expect(queryByRole("option", { name: "Inactive" })).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
