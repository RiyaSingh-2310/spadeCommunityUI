import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PolylineChart } from "./dashboardCharts";

describe("PolylineChart", () => {
  const data = [
    { label: "Jan", fullLabel: "Jan 2026", value: 2 },
    { label: "Feb", fullLabel: "Feb 2026", value: 5 },
    { label: "Mar", fullLabel: "Mar 2026", value: 0 },
    { label: "Apr", fullLabel: "Apr 2026", value: 11 },
  ];

  it("renders a Y-axis scaled to the data and keeps X-axis category labels", () => {
    render(<PolylineChart data={data} />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Feb")).toBeInTheDocument();
    expect(screen.getByText("Mar")).toBeInTheDocument();
    expect(screen.getByText("Apr")).toBeInTheDocument();
  });

  it("shows the exact category name and value for every hovered point", () => {
    const { container } = render(<PolylineChart data={data} />);
    const hitTargets = container.querySelectorAll('rect[role="img"]');
    expect(hitTargets).toHaveLength(data.length);

    data.forEach((item, idx) => {
      fireEvent.mouseEnter(hitTargets[idx]);
      expect(screen.getByRole("tooltip")).toHaveTextContent(item.fullLabel);
      expect(screen.getByRole("tooltip")).toHaveTextContent(String(item.value));
    });
  });
});
