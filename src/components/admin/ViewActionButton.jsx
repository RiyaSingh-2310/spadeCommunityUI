import { Eye } from "lucide-react";

function ViewActionButton({ onView, label = "View" }) {
  if (!onView) return null;

  return (
    <button
      type="button"
      onClick={onView}
      className="admin-icon-action !h-auto !w-auto gap-1.5 px-2.5 py-1.5 text-xs font-semibold"
      aria-label={label}
      title={label}
    >
      <Eye size={16} strokeWidth={2} />
      {label}
    </button>
  );
}

export default ViewActionButton;
