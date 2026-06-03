const PERMISSION_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "all", label: "All" },
  { value: "read", label: "Read" },
];

function FormPermissionSelect({
  value,
  onChange,
  inputClass,
  label = "Permission Type",
}) {
  return (
    <div>
      <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {PERMISSION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FormPermissionSelect;
