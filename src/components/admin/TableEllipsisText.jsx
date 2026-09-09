/**
 * Single-line truncated text for table cells and compact detail fields.
 * Parent must constrain width (admin-table-ellipsis-cell or max-width).
 */
function TableEllipsisText({ children, title, className = "", as: Tag = "span" }) {
  const text = children == null || children === "" ? "-" : children;
  const resolvedTitle =
    title !== undefined
      ? title
      : typeof text === "string" && text !== "-" && text !== "—"
        ? text
        : undefined;

  return (
    <Tag
      className={`admin-table-ellipsis-text admin-text ${className}`.trim()}
      title={resolvedTitle}
      {...(Tag === "button" ? { type: "button" } : {})}
    >
      {text}
    </Tag>
  );
}

export default TableEllipsisText;
