import { Eye } from "lucide-react";

function ViewActionButton({ isDarkMode, onView, label = "View" }) {
  if (!onView) return null;

  return (
    <button
      type="button"
      onClick={onView}
      className="admin-icon-action-btn inline-flex h-8 w-auto gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
      aria-label="View"
      title="View"
    >
      <Eye size={14} strokeWidth={2} />
      {label}
    </button>
  );
}

export default ViewActionButton;
