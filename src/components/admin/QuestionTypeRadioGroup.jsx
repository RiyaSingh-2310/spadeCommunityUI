function QuestionTypeRadioGroup({ value, onChange, options, isDarkMode }) {
  return (
    <fieldset>
      <legend className="admin-text mb-2 block text-sm font-semibold">Question Type</legend>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-4">
        {options.map((type) => (
          <label
            key={type}
            className="admin-text flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="radio"
              name="questionType"
              value={type}
              checked={value === type}
              onChange={() => onChange(type)}
              className={`h-4 w-4 accent-[var(--admin-primary-color)] ${
                isDarkMode ? "border-[#344662]" : "border-[#d8e3ef]"
              }`}
            />
            {type}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default QuestionTypeRadioGroup;
