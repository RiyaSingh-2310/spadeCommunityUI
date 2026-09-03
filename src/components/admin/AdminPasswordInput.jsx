import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getAdminInputClass } from "../../modules/shared/utils/formStyles";

/**
 * Shared password field with show/hide control.
 * Uses the same `.admin-input` shape as Name/Email so autofill cannot square the corners.
 */
function AdminPasswordInput({
  value,
  onChange,
  onBlur,
  placeholder = "Enter Password",
  disabled = false,
  maxLength,
  autoComplete = "new-password",
  id,
  name,
  "aria-label": ariaLabel,
  className = "",
}) {
  const [visible, setVisible] = useState(false);
  const inputClass = getAdminInputClass();

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        className={`${inputClass} pr-10 ${className}`.trim()}
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        onChange={(event) => onChange?.(event)}
        onBlur={onBlur}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="admin-text-subtle absolute right-3 top-1/2 -translate-y-1/2"
        disabled={disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default AdminPasswordInput;
