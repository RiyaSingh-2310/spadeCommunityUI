function AdminPageHeader({
  title,
  subtitle,
  rightContent,
  isDarkMode,
}) {
  const wrapperClass = rightContent
    ? "mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between"
    : "mb-1.5";

  return (
    <div className={wrapperClass}>
      <div>
        <h1
          className={`text-2xl font-bold tracking-[-0.015em] ${
            isDarkMode ? "text-[#f8fafc]" : "text-[#1f2b3d]"
          }`}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={`mt-1 text-sm ${isDarkMode ? "text-[#9fb0c8]" : "text-[#6f8098]"}`}>
            {subtitle}
          </p>
        )}
      </div>
      {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
    </div>
  );
}

export default AdminPageHeader;
