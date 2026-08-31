import { toUiSentenceCase } from "../../modules/shared/utils/uiText";

function FormField({ label, error, hint, required, children, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label className="admin-text mb-2 block text-sm font-semibold">
          {toUiSentenceCase(label)}
          {required && <span className="text-[var(--admin-danger-text)]"> *</span>}
        </label>
      )}
      {children}
      {hint && (
        <p className="admin-text-muted mt-1 text-xs">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-[var(--admin-danger-text)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
