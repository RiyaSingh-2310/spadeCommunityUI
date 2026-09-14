const CHART_COLORS = ["#10a950", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#64748b", "#0ea5e9"];

const AGE_BUCKET_ORDER = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"];

function asText(value) {
  return String(value ?? "").trim();
}

function parseNumeric(value) {
  const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : null;
}

function bucketAge(value) {
  const age = parseNumeric(value);
  if (age == null) return null;
  if (age < 18) return "Under 18";
  if (age <= 24) return "18–24";
  if (age <= 34) return "25–34";
  if (age <= 44) return "35–44";
  if (age <= 54) return "45–54";
  return "55+";
}

function splitMultiAnswers(answers) {
  return answers.flatMap((answer) =>
    asText(answer)
      .split(/\s*(?:,|;|\||\/)\s*/)
      .map((part) => asText(part))
      .filter(Boolean)
  );
}

function majorityNumeric(answers) {
  if (answers.length === 0) return false;
  const numericCount = answers.filter((answer) => parseNumeric(answer) != null).length;
  return numericCount / answers.length >= 0.7;
}

function uniqueRatio(answers) {
  if (answers.length === 0) return 0;
  return new Set(answers.map((answer) => asText(answer).toLowerCase())).size / answers.length;
}

/**
 * Infer visualization kind from question type, wording, and answer shape.
 * New questionnaire questions are classified automatically.
 */
export function classifyQuestion(questionText, questionType, answers = []) {
  const text = asText(questionText).toLowerCase();
  const type = asText(questionType).toLowerCase();
  const numericAnswers = majorityNumeric(answers);

  if (/\bage\b/.test(text) && (numericAnswers || type.includes("number") || type.includes("numeric"))) {
    return "age";
  }
  if (
    type.includes("checkbox") ||
    type.includes("multi") ||
    type === "checkbox"
  ) {
    return "multi";
  }
  if (
    type.includes("number") ||
    type.includes("numeric") ||
    type.includes("slider") ||
    (numericAnswers && !/\bgender\b|\bsex\b|relationship|marital/.test(text))
  ) {
    return "numeric";
  }
  if (type.includes("text area") || type.includes("textarea") || type.includes("open")) {
    return "text";
  }
  if (
    type.includes("text box") ||
    type.includes("textbox") ||
    type === "text"
  ) {
    if (numericAnswers) return "numeric";
    if (uniqueRatio(answers) > 0.55 && answers.length > 8) return "text";
    return "choice";
  }
  if (type.includes("date") || type.includes("time")) {
    return uniqueRatio(answers) > 0.5 ? "text" : "choice";
  }
  if (
    type.includes("radio") ||
    type.includes("dropdown") ||
    type.includes("select") ||
    type.includes("single")
  ) {
    return "choice";
  }
  if (answers.length > 0 && uniqueRatio(answers) > 0.7 && answers.length > 6) {
    return "text";
  }
  if (answers.length > 0) return "choice";
  return "unknown";
}

function withPercents(series, total) {
  const denominator = total > 0 ? total : series.reduce((sum, row) => sum + row.value, 0) || 1;
  return series.map((row) => ({
    ...row,
    percent: Math.round((row.value / denominator) * 1000) / 10,
  }));
}

function countAnswers(answers, { preserveOrder = [] } = {}) {
  const counts = new Map();
  answers.forEach((answer) => {
    const label = asText(answer);
    if (!label) return;
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  if (preserveOrder.length > 0) {
    return preserveOrder
      .filter((label) => counts.has(label))
      .map((label, index) => ({
        label,
        value: counts.get(label),
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));
  }

  return [...counts.entries()]
    .map(([label, value], index) => ({
      label,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

function numericStats(values) {
  if (values.length === 0) {
    return { min: null, max: null, average: null, median: null };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    average: Math.round((sum / sorted.length) * 10) / 10,
    median: Math.round(median * 10) / 10,
  };
}

function bucketNumeric(values) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ label: String(min), value: values.length, color: CHART_COLORS[0] }];
  }
  const bucketCount = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(values.length))));
  const width = (max - min) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const start = min + index * width;
    const end = index === bucketCount - 1 ? max : start + width;
    const label =
      Number.isInteger(start) && Number.isInteger(end)
        ? `${Math.round(start)}–${Math.round(end)}`
        : `${start.toFixed(1)}–${end.toFixed(1)}`;
    return { label, start, end, value: 0, color: CHART_COLORS[index % CHART_COLORS.length] };
  });
  values.forEach((value) => {
    const index = Math.min(bucketCount - 1, Math.floor((value - min) / width));
    buckets[index].value += 1;
  });
  return buckets.map(({ label, value, color }) => ({ label, value, color }));
}

function pickChart(kind, series) {
  if (kind === "text" || kind === "unknown") return "table";
  if (kind === "age" || kind === "numeric") return "histogram";
  if (kind === "multi") return "bars";
  if (kind === "choice" && series.length <= 6) return "donut";
  return "bars";
}

function buildInsight(series, total) {
  if (!series.length || total <= 0) return "";
  const top = series.reduce((best, row) => (row.value > best.value ? row : best), series[0]);
  const percent = Math.round((top.value / total) * 100);
  return `${top.label} represents ${percent}% of respondents`;
}

/**
 * Build dashboard visualizations from real question + answer records.
 * @param {{ question: string, questionType?: string, answers: string[], sortOrder?: number, skipped?: number, id?: string }[]} questions
 */
export function buildQuestionVisualizations(questions) {
  return (Array.isArray(questions) ? questions : [])
    .map((item, index) => {
      const question = asText(item.question);
      if (!question) return null;

      const rawAnswers = Array.isArray(item.answers)
        ? item.answers.map((entry) => asText(entry)).filter(Boolean)
        : [];
      const kind = classifyQuestion(question, item.questionType, rawAnswers);
      const workingAnswers = kind === "multi" ? splitMultiAnswers(rawAnswers) : rawAnswers;

      if (workingAnswers.length === 0) {
        return {
          id: item.id ?? question,
          title: question,
          kind,
          chart: "empty",
          series: [],
          total: 0,
          skipped: Number(item.skipped) || 0,
          sortOrder: Number(item.sortOrder) || index + 1,
          insight: "",
          stats: null,
        };
      }

      let series;
      let stats = null;
      let total = workingAnswers.length;

      if (kind === "age") {
        const mapped = workingAnswers.map(bucketAge).filter(Boolean);
        total = mapped.length;
        series = countAnswers(mapped, { preserveOrder: AGE_BUCKET_ORDER });
      } else if (kind === "numeric") {
        const values = workingAnswers.map(parseNumeric).filter((value) => value != null);
        total = values.length;
        stats = numericStats(values);
        series = bucketNumeric(values);
      } else {
        series = countAnswers(workingAnswers);
      }

      series = withPercents(series, total);
      const chart = pickChart(kind, series);

      return {
        id: item.id ?? question,
        title: question,
        kind,
        chart,
        series,
        total,
        skipped: Number(item.skipped) || 0,
        sortOrder: Number(item.sortOrder) || index + 1,
        insight: buildInsight(series, total),
        stats,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function bucketRewardPoints(points) {
  const order = ["0", "1–50", "51–100", "101–250", "251–500", "501+"];
  const counts = new Map(order.map((label) => [label, 0]));
  points.forEach((value) => {
    const amount = Number(value) || 0;
    let label = "501+";
    if (amount <= 0) label = "0";
    else if (amount <= 50) label = "1–50";
    else if (amount <= 100) label = "51–100";
    else if (amount <= 250) label = "101–250";
    else if (amount <= 500) label = "251–500";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  const total = points.length || 1;
  return order
    .map((label, index) => ({
      label,
      value: counts.get(label) || 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .filter((row) => row.value > 0)
    .map((row) => ({
      ...row,
      percent: Math.round((row.value / total) * 1000) / 10,
    }));
}
