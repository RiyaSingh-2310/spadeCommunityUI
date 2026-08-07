import Breadcrumbs from "./Breadcrumbs";

function AdminPageHeader({
  title,
  rightContent,
  breadcrumbs,
}) {
  const wrapperClass = rightContent
    ? "mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between"
    : "mb-6";

  return (
    <div className={wrapperClass}>
      <div>
        <h1 className="admin-text admin-page-title text-xl leading-[1.2] tracking-[-0.015em] sm:text-2xl lg:text-[28px]">
          {title}
        </h1>
        <Breadcrumbs items={breadcrumbs} />
        
      </div>
      {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
    </div>
  );
}

export default AdminPageHeader;
