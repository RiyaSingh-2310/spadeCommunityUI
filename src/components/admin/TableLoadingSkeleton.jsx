function TableLoadingSkeleton({ columns, rowCount = 6 }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <tr
          key={rowIdx}
          className="border-t align-middle"
          style={{ borderColor: "var(--admin-permissions-row-border)" }}
        >
          {columns.map((col) => (
            <td key={col} className="px-4 py-3 align-middle">
              <div
                className={`h-4 animate-pulse rounded-md bg-[var(--admin-skeleton-bg)] ${
                  col === "" ? "w-8" : col === "Action" || col === "Actions" ? "ml-auto w-16" : col === "Name" ? "w-32" : "w-20"
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default TableLoadingSkeleton;
