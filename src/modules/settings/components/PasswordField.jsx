import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import FormField from "../../../components/admin/FormField";
import { getAdminInputClass } from "../../shared/utils/formStyles";

function PasswordField({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  disabled = false,
  required = false,
}) {
  const [visible, setVisible] = useState(false);
  const inputClass = getAdminInputClass();

  return (
    <FormField label={label} required={required} error={error}>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          className={`${inputClass} pr-10`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={disabled}
          autoComplete={label === "Current Password" ? "current-password" : label === "New Password" ? "new-password" : "new-password"}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </FormField>
  );
}

export default PasswordField;
