function FormRadioGroup({ label, name, value, onChange, options, isDarkMode, disabled = false }) {
  return (
    <div>
      <span className="admin-text mb-2 block text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <label
            key={option}
            className={`admin-text flex items-center gap-2 text-sm ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              disabled={disabled}
              className="h-4 w-4 accent-[var(--admin-primary-color)]"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

export default FormRadioGroup;
