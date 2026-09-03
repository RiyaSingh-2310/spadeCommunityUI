import FormField from "../../../components/admin/FormField";
import AdminPasswordInput from "../../../components/admin/AdminPasswordInput";

function PasswordField({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  disabled = false,
  required = false,
  maxLength,
}) {
  const autoComplete =
    label === "Current Password"
      ? "current-password"
      : "new-password";

  return (
    <FormField label={label} required={required} error={error}>
      <AdminPasswordInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-label={label}
      />
    </FormField>
  );
}

export default PasswordField;
