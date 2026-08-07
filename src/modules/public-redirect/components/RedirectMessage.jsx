function RedirectMessage({ title, message, icon: Icon, variant = "neutral" }) {
  const isSuccess = variant === "success";

  return (
    <>
      {Icon ? (
        <div className={isSuccess ? "pq-completion-icon" : "pq-empty-icon"} aria-hidden>
          <Icon size={isSuccess ? 36 : 32} strokeWidth={1.75} />
        </div>
      ) : null}

      <h1 className={isSuccess ? "pq-completion-title" : "pq-empty-title"}>{title}</h1>

      {message ? (
        <p className={isSuccess ? "pq-completion-message" : "pq-empty-description"}>{message}</p>
      ) : null}
    </>
  );
}

export default RedirectMessage;
