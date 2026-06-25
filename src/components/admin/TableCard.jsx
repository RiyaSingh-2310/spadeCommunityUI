function TableCard({ title, children, footer, isDarkMode }) {
  return (
    <section className="admin-table-card rounded-2xl border p-4 transition-shadow duration-300 sm:p-5">
      {title && (
        <h2 className="admin-card-title admin-section-title mb-3 text-lg">
          {title}
        </h2>
      )}
      <div className="admin-table-scroll min-w-0 overflow-x-auto">{children}</div>
      {footer ? <div className="mt-1 border-t border-[var(--admin-table-row-border)] pt-4">{footer}</div> : null}
    </section>
  );
}

export default TableCard;
