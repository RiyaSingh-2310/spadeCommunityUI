import { Eye } from "lucide-react";

function ViewActionButton({ isDarkMode, onView, label = "View" }) {
  if (!onView) return null;

  return (
    <button
      type="button"
      onClick={onView}
      className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold whitespace-nowrap transition-colors ${
        isDarkMode
          ? "text-[#9fb0c8] hover:bg-[#1e2e45] hover:text-[#f8fafc]"
          : "text-[#5e718a] hover:bg-[#eef4fb] hover:text-[#203148]"
      }`}
      aria-label="view"
    >
      <Eye size={13} />
      {label}
    </button>
  );
}

export default ViewActionButton;
