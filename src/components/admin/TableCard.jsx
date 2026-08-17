function TableCard({ title, children, footer, flush = false, headerAction }) {
  const hasBody = children != null && children !== false;
  const bodyClassName = flush
    ? "admin-table-scroll min-w-0 overflow-x-auto"
    : "admin-card-body admin-table-scroll min-w-0 overflow-x-auto";
  const headerLayoutClass = headerAction
    ? "flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"
    : "px-4 py-4 sm:px-5";
  const headerBorderClass =
    hasBody || footer
      ? " border-b border-[var(--admin-table-border)]"
      : "";

  return (
    <section className="admin-card-surface overflow-hidden rounded-2xl border">
      {title ? (
        <div className={`${headerLayoutClass}${headerBorderClass}`}>
          <h2 className="admin-card-title text-lg font-semibold">{title}</h2>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      ) : null}
      {hasBody ? <div className={bodyClassName}>{children}</div> : null}
      {footer ? (
        <div className="border-t border-[var(--admin-header-surface-border)] px-4 py-4 sm:px-5">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export default TableCard;
