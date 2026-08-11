/**
 * Status title, primary message, thank-you line, and multilingual section.
 */
function RedirectMessage({
  title,
  message,
  icon: Icon,
  variant = "neutral",
  thankYouLines = [],
}) {
  const lines = Array.isArray(thankYouLines)
    ? thankYouLines.map((line) => String(line ?? "").trim()).filter(Boolean)
    : [];
  const [primaryThankYou, ...otherThankYous] = lines;

  const titleText = String(title ?? "").trim();
  const titleParts = titleText.includes(" ")
    ? (() => {
        const idx = titleText.lastIndexOf(" ");
        return [titleText.slice(0, idx), titleText.slice(idx + 1)];
      })()
    : [titleText, ""];

  return (
    <>
      {Icon ? (
        <div
          className={`pq-redirect-icon pq-redirect-icon--${variant}`}
          aria-hidden
        >
          <Icon size={36} strokeWidth={1.75} />
        </div>
      ) : null}

      <h1 className="pq-redirect-title">
        {titleParts[0]}
        {titleParts[1] ? (
          <>
            {" "}
            <span className="pq-redirect-title-accent">{titleParts[1]}</span>
          </>
        ) : null}
      </h1>

      {message ? <p className="pq-redirect-message">{message}</p> : null}

      {primaryThankYou ? (
        <p className="pq-redirect-thankyou">{primaryThankYou}</p>
      ) : null}

      {otherThankYous.length > 0 ? (
        <section className="pq-redirect-i18n" aria-label="Messages in other languages">
          <p className="pq-redirect-i18n-label">Other languages</p>
          <ul className="pq-redirect-i18n-list">
            {otherThankYous.map((line) => (
              <li key={line} className="pq-redirect-i18n-item">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

export default RedirectMessage;
