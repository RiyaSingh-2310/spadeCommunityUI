function TableCard({ title, children, footer, flush = false, headerAction }) {
  const bodyClassName = flush
    ? "admin-table-scroll min-w-0 overflow-x-auto"
    : "admin-card-body admin-table-scroll min-w-0 overflow-x-auto";

  return (
    <section className="admin-card-surface overflow-hidden rounded-2xl border">
      {title ? (
        <div
          className={
            headerAction
              ? "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-table-border)] px-4 py-4 sm:px-5"
              : "border-b border-[var(--admin-table-border)] px-4 py-4 sm:px-5"
          }
        >
          <h2 className="admin-card-title text-lg font-semibold">{title}</h2>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
      {footer ? (
        <div className="border-t border-[var(--admin-header-surface-border)] px-4 py-4 sm:px-5">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export default TableCard;
