import { describe, expect, it } from "vitest";
import {
  buildQuestionVisualizations,
  classifyQuestion,
} from "./buildQuestionVisualizations";

describe("buildQuestionVisualizations", () => {
  it("buckets age answers", () => {
    const [chart] = buildQuestionVisualizations([
      {
        question: "What is your age?",
        questionType: "numeric",
        answers: ["22", "31", "47", "60"],
      },
    ]);
    expect(chart.kind).toBe("age");
    expect(chart.chart).toBe("histogram");
    expect(chart.title).toBe("What is your age?");
    expect(chart.total).toBe(4);
    expect(chart.series.map((row) => row.label)).toEqual([
      "18–24",
      "25–34",
      "45–54",
      "55+",
    ]);
  });

  it("uses a donut for gender", () => {
    const [chart] = buildQuestionVisualizations([
      {
        question: "What is your gender?",
        questionType: "radio",
        answers: ["Male", "Female", "Male"],
      },
    ]);
    expect(chart.chart).toBe("donut");
    expect(chart.title).toBe("What is your gender?");
    expect(chart.series.find((row) => row.label === "Male")?.value).toBe(2);
    expect(chart.series.find((row) => row.label === "Male")?.percent).toBe(66.7);
  });

  it("uses horizontal bars for multiple-choice questions", () => {
    const [chart] = buildQuestionVisualizations([
      {
        question: "Which features are most important to you?",
        questionType: "Checkbox",
        answers: ["Price, Quality", "Quality", "Support"],
      },
    ]);
    expect(chart.kind).toBe("multi");
    expect(chart.chart).toBe("bars");
    expect(chart.series.find((row) => row.label === "Quality")?.value).toBe(2);
  });

  it("summarizes numeric questions instead of listing every value", () => {
    const [chart] = buildQuestionVisualizations([
      {
        question: "How many years have you been using smartphones?",
        questionType: "Number",
        answers: ["1", "3", "8", "12"],
      },
    ]);
    expect(chart.kind).toBe("numeric");
    expect(chart.chart).toBe("histogram");
    expect(chart.stats).toMatchObject({ min: 1, max: 12 });
  });

  it("shows an empty state for questions with no answers", () => {
    const [chart] = buildQuestionVisualizations([{ question: "Unused?", answers: [] }]);
    expect(chart.chart).toBe("empty");
    expect(chart.total).toBe(0);
    expect(chart.title).toBe("Unused?");
  });

  it("uses a table for open-text questions", () => {
    const [chart] = buildQuestionVisualizations([
      {
        question: "What's your reason for choosing this product?",
        questionType: "Text Area",
        answers: ["Quality", "Price"],
      },
    ]);
    expect(chart.kind).toBe("text");
    expect(chart.chart).toBe("table");
  });
});

describe("classifyQuestion", () => {
  it("classifies a new city question as choice data", () => {
    expect(
      classifyQuestion("Which city do you currently live in?", "Dropdown", [
        "Delhi",
        "Mumbai",
        "Delhi",
      ])
    ).toBe("choice");
  });
});
