import { getAdminInputClass } from "../../shared/utils/formStyles";

function normalizeOptions(options = []) {
  return options.map((option) => {
    if (typeof option === "string") {
      return { label: option, value: option };
    }
    return {
      label: option.label ?? String(option.value ?? ""),
      value: option.value ?? option.label ?? "",
    };
  });
}

function QuestionRenderer({ question, value, onChange }) {
  const options = normalizeOptions(question.options);
  const questionType = question.questionType;

  if (questionType === "Checkbox") {
    const selected = Array.isArray(value) ? value : [];

    return (
      <fieldset className="space-y-3">
        <legend className="sr-only">{question.questionText}</legend>
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition hover:border-[var(--admin-primary-color)]"
              style={{
                borderColor: checked
                  ? "var(--admin-primary-color)"
                  : "var(--admin-input-border)",
                background: checked
                  ? "color-mix(in srgb, var(--admin-primary-color) 10%, transparent)"
                  : "var(--admin-input-bg)",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  if (checked) {
                    onChange(selected.filter((item) => item !== option.value));
                  } else {
                    onChange([...selected, option.value]);
                  }
                }}
                className="mt-0.5 h-4 w-4 accent-[var(--admin-primary-color)]"
              />
              <span className="text-sm leading-snug" style={{ color: "var(--admin-foreground)" }}>
                {option.label}
              </span>
            </label>
          );
        })}
      </fieldset>
    );
  }

  if (questionType === "Dropdown") {
    return (
      <select
        className={getAdminInputClass()}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label={question.questionText}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (questionType === "Text" || questionType === "Textarea") {
    return (
      <textarea
        className={`${getAdminInputClass()} min-h-[120px] resize-y py-3`}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type your answer here..."
        aria-label={question.questionText}
      />
    );
  }

  // Default: Radio Button / single-select
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">{question.questionText}</legend>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition hover:border-[var(--admin-primary-color)]"
            style={{
              borderColor: selected
                ? "var(--admin-primary-color)"
                : "var(--admin-input-border)",
              background: selected
                ? "color-mix(in srgb, var(--admin-primary-color) 10%, transparent)"
                : "var(--admin-input-bg)",
            }}
          >
            <input
              type="radio"
              name={question.id}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="mt-0.5 h-4 w-4 accent-[var(--admin-primary-color)]"
            />
            <span className="text-sm leading-snug" style={{ color: "var(--admin-foreground)" }}>
              {option.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

export default QuestionRenderer;
