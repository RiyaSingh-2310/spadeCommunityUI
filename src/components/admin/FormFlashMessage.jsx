function FormFlashMessage({ message, type = "success" }) {
  if (!message) return null;

  const isError = type === "error";

  return (
    <p
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${
        isError
          ? "border-[var(--admin-danger-text)]/30 bg-[var(--admin-danger-text)]/10 text-[var(--admin-danger-text)]"
          : "border-[var(--admin-success-text)]/30 bg-[var(--admin-success-text)]/10 text-[var(--admin-success-text)]"
      }`}
      role={isError ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

export default FormFlashMessage;
