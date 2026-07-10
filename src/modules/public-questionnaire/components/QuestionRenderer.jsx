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

function normalizeQuestionType(questionType) {
  const raw = String(questionType ?? "").trim();
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");

  if (["textbox", "text", "singlelinetext"].includes(key)) return "Text Box";
  if (["textarea", "multilinetext"].includes(key)) return "Text Area";
  if (key === "number") return "Number";
  if (key === "date") return "Date";
  if (key === "time") return "Time";
  if (["datetime", "dateandtime"].includes(key)) return "Date-Time";
  if (key === "dropdown") return "Dropdown";
  if (key === "checkbox") return "Checkbox";
  if (["radiobutton", "radio"].includes(key)) return "Radio Button";

  if (raw === "Date Time" || raw === "Date & Time") return "Date-Time";
  return raw;
}

function OptionChoiceList({ question, options, value, onChange, multiple }) {
  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value;

  return (
    <fieldset className="pq-choice-list">
      <legend className="sr-only">{question.questionText}</legend>
      {options.map((option) => {
        const selected = multiple
          ? selectedValues.includes(option.value)
          : selectedValues === option.value;

        return (
          <label
            key={option.value}
            className={`pq-choice ${selected ? "pq-choice--selected" : ""}`}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              className="pq-choice-input"
              name={multiple ? undefined : String(question.id)}
              value={option.value}
              checked={selected}
              onChange={() => {
                if (!multiple) {
                  onChange(option.value);
                  return;
                }
                if (selected) {
                  onChange(selectedValues.filter((item) => item !== option.value));
                } else {
                  onChange([...selectedValues, option.value]);
                }
              }}
            />
            <span className={`pq-choice-indicator ${multiple ? "pq-choice-indicator--checkbox" : "pq-choice-indicator--radio"}`} aria-hidden>
              {multiple && selected ? (
                <svg viewBox="0 0 12 10" className="pq-choice-check" fill="none">
                  <path
                    d="M1.5 5.2L4.4 8.1L10.5 1.9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
            <span className="pq-choice-label">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

function QuestionRenderer({ question, value, onChange }) {
  const options = normalizeOptions(question.options);
  const questionType = normalizeQuestionType(question.questionType);

  if (questionType === "Checkbox") {
    return (
      <OptionChoiceList
        question={question}
        options={options}
        value={value}
        onChange={onChange}
        multiple
      />
    );
  }

  if (questionType === "Radio Button") {
    return (
      <OptionChoiceList
        question={question}
        options={options}
        value={value}
        onChange={onChange}
        multiple={false}
      />
    );
  }

  if (questionType === "Dropdown") {
    return (
      <div className="pq-select-wrap">
        <select
          className="pq-select"
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
      </div>
    );
  }

  if (questionType === "Text Area") {
    return (
      <textarea
        className="pq-textarea"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type your answer here..."
        aria-label={question.questionText}
      />
    );
  }

  if (questionType === "Number") {
    return (
      <input
        type="number"
        className="pq-input"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter a number"
        aria-label={question.questionText}
      />
    );
  }

  if (questionType === "Date") {
    return (
      <input
        type="date"
        className="pq-input"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label={question.questionText}
      />
    );
  }

  if (questionType === "Time") {
    return (
      <input
        type="time"
        className="pq-input"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label={question.questionText}
      />
    );
  }

  if (questionType === "Date-Time") {
    return (
      <input
        type="datetime-local"
        className="pq-input"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label={question.questionText}
      />
    );
  }

  return (
    <input
      type="text"
      className="pq-input"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Type your answer here..."
      aria-label={question.questionText}
    />
  );
}

export default QuestionRenderer;
