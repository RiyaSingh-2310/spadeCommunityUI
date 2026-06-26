function AdminSummaryCards({ cards = [] }) {
  if (!cards.length) return null;

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const key = `${card.label}-${String(card.value)}`;

        return (
          <article
            key={key}
            className="admin-card-surface rounded-2xl border p-4 sm:p-5"
          >
            {Icon ? (
              <span className="admin-summary-card-icon mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl">
                <Icon size={18} strokeWidth={2} aria-hidden />
              </span>
            ) : null}
            <p className="admin-text-muted text-xs font-medium">{card.label}</p>
            <p className="admin-text mt-1 text-xl font-semibold tracking-tight">
              {card.value}
            </p>
          </article>
        );
      })}
    </div>
  );
}

export default AdminSummaryCards;
