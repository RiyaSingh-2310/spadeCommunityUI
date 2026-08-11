import Breadcrumbs from "./Breadcrumbs";

function AdminPageHeader({
  title,
  subtitle,
  rightContent,
  breadcrumbs,
}) {
  const wrapperClass = rightContent
    ? "mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between"
    : "mb-6";

  const normalizedSubtitle =
    subtitle == null ? "" : String(subtitle).trim();

  return (
    <div className={wrapperClass}>
      <div className="min-w-0">
        <h1 className="admin-text admin-page-title text-xl leading-[1.2] tracking-[-0.015em] sm:text-2xl lg:text-[28px]">
          {title}
        </h1>
        {normalizedSubtitle ? (
          <p className="admin-text-muted mt-1 max-w-3xl break-words text-sm leading-5">
            {normalizedSubtitle}
          </p>
        ) : null}
        <Breadcrumbs items={breadcrumbs} />
      </div>
      {rightContent && <div className="flex shrink-0 items-center gap-3">{rightContent}</div>}
    </div>
  );
}

export default AdminPageHeader;
