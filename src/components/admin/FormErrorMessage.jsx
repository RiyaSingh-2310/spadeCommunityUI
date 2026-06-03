function FormErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p
      className="rounded-xl border px-4 py-3 text-sm font-medium border-[var(--admin-danger-text)]/30 bg-[var(--admin-danger-text)]/10 text-[var(--admin-danger-text)]"
      role="alert"
    >
      {message}
    </p>
  );
}

export default FormErrorMessage;
