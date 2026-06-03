function FormField({ label, error, required, children, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label className="admin-text mb-2 block text-sm font-semibold">
          {label}
          {required && <span className="text-[var(--admin-danger-text)]"> *</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-xs text-[var(--admin-danger-text)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
