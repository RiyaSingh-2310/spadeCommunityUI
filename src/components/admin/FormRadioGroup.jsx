function FormRadioGroup({ label, name, value, onChange, options, isDarkMode }) {
  return (
    <div>
      <span className="admin-text mb-2 block text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <label
            key={option}
            className="admin-text flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
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
