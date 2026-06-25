function AdminSummaryCards({ cards = [], isDarkMode = false }) {
  if (!cards.length) return null;

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const key = `${card.label}-${String(card.value)}`;

        return (
          <article
            key={key}
            className={`rounded-3xl border p-4 transition-all duration-300 sm:p-5 ${
              isDarkMode
                ? "border-[#283b58] bg-[#131f31] shadow-[0_16px_35px_rgba(2,6,23,0.3)]"
                : "border-[#dce7f3] bg-white shadow-[0_10px_26px_rgba(17,36,65,0.08)]"
            }`}
          >
            {Icon ? (
              <span
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                  isDarkMode ? "bg-[#1a273c] text-[#9fb0c8]" : "bg-[#f4f8fc] text-[#5e718a]"
                }`}
              >
                <Icon size={18} aria-hidden />
              </span>
            ) : null}
            <p className="admin-text-muted text-xs font-medium">{card.label}</p>
            <p className="admin-text mt-1 text-xl font-semibold">{card.value}</p>
          </article>
        );
      })}
    </div>
  );
}

export default AdminSummaryCards;
