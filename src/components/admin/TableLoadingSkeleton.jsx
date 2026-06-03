function TableLoadingSkeleton({ columns, rowCount = 6, isDarkMode }) {
  const barClass = isDarkMode ? "bg-[#263850]" : "bg-[#e6edf5]";

  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <tr
          key={rowIdx}
          className={`border-t ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}
        >
          {columns.map((col) => (
            <td key={col} className="px-4 py-3 align-middle">
              <div
                className={`h-4 animate-pulse rounded-md ${barClass} ${
                  col === "Action" ? "ml-auto w-16" : col === "Name" ? "w-32" : "w-20"
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
