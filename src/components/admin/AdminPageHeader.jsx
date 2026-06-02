import Breadcrumbs from "./Breadcrumbs";

function AdminPageHeader({
  title,
  subtitle,
  rightContent,
  breadcrumbs,
  isDarkMode,
}) {
  const wrapperClass = rightContent
    ? "mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between"
    : "mb-6";

  return (
    <div className={wrapperClass}>
      <div>
        <h1
          className="admin-text text-[28px] leading-[1.2] font-bold tracking-[-0.015em]"
        >
          {title}
        </h1>
        <Breadcrumbs items={breadcrumbs} isDarkMode={isDarkMode} />
        {subtitle && (
          <p className="admin-text-muted mt-1 text-sm">
            {subtitle}
          </p>
        )}
      </div>
      {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
    </div>
  );
}

export default AdminPageHeader;
