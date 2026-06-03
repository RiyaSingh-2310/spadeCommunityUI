function FormSuccessMessage({ message }) {
  if (!message) return null;
  return (
    <p
      className="rounded-xl border px-4 py-3 text-sm font-medium border-[var(--admin-success-text)]/30 bg-[var(--admin-success-text)]/10 text-[var(--admin-success-text)]"
      role="status"
    >
      {message}
    </p>
  );
}

export default FormSuccessMessage;
