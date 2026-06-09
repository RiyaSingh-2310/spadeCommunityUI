import SearchableSelect from "./SearchableSelect";

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
  disabled = false,
}) {
  return (
    <div>
      <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={PERMISSION_OPTIONS}
        placeholder="Select Permission Type"
        disabled={disabled}
        inputClass={inputClass}
        searchable={false}
        aria-label={label}
      />
    </div>
  );
}

export default FormPermissionSelect;
